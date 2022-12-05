/*
SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"encoding/json"
	"fmt"
	"time"
	"log"

	"github.com/golang/protobuf/ptypes"
	"github.com/hyperledger/fabric-contract-api-go/contractapi" // hyperledger fabric chaincode GO SDK
)

type SmartContract struct {  // SmartContract 객체중 구조체
	contractapi.Contract // 상속
}

type DRecord struct { // world state 에 value 에 JSON으로 marshal 되어 저장될 구조체
	Gardian   	string `json:"gadian"`
	RID  		string `json:"receiptid"`
	DiagInfo	string `json:"diagnosisinfo"`
	Price		int 	`json:"price"`
	Status  	string `json:"status"` // registered, verified, diagnosis, prognosis 
}

type QueryResult struct { // queryallcars 에서 검색된 K, V 쌍들을 배열로 만들기 위해 사용되는 검색결과 구조체
	Key    string `json:"Key"`
	Record *DRecord
}

// History 결과저장을 위한 구조체
type HistoryQueryResult struct{
	Record 		*DRecord		`json:"record"`
	TxId		string		`json:"txId"`
	Timestamp 	time.Time	`json:"timestamp"`
	IsDelete	bool		`json:"isDelete"`
}

func (s *SmartContract) Register_receipt(ctx contractapi.TransactionContextInterface, rid string, gardian string, diaginfo string, price int) error { 
	
	// (TO DO) 오류검증 - 각 매개변수안에 유효값이 들어있는지 검사 
	
	drecord := DRecord{
		Gardian:   gardian,
		RID:  rid,
		DiagInfo: diaginfo, // 진료일, 증상....
		Price: price,
		Status: "registered",
	}

	dAsBytes, _ := json.Marshal(drecord) // 생성한 구조체 Marshal ( 직렬화 )

	return ctx.GetStub().PutState(rid, dAsBytes)  
	// value: JSON format
	// endorser peer 반환 -> 서명 -> APP -> orderer -> commiter 동기화
}

func (s *SmartContract) Query_record(ctx contractapi.TransactionContextInterface, rid string) (*DRecord, error) { 
	dAsBytes, err := ctx.GetStub().GetState(rid) // state -> JSON format []byte

	if err != nil { // GetState, GetStub, ctx참조가 오류를 만났을때
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if dAsBytes == nil { // key가 저장된적이 없다 or delete된 경우
		return nil, fmt.Errorf("%s does not exist", rid)
	}

	// 정상적으로 조회가 된 경우
	diag := new(DRecord) // 객체화 JSON -> 구조체
	_ = json.Unmarshal(dAsBytes, diag) // call by REFERENCE

	return diag, nil
}

func (s *SmartContract) Verify_receipt(ctx contractapi.TransactionContextInterface, rid string, verifier string) error { // application - submitTransaction("ChangeCarOwner", "CAR10", "blockchain")
	
	diag, err := s.Query_record(ctx, rid)

	if err != nil {
		return err
	}
	// 검증 생략 -- 이전 소유자에서 전달되었는지 유효한지
	if diag.Status == "registered" {
		// 상태변경 
		diag.Status = "verified"
		// (TO DO) 검증자 기록
		dAsBytes, _ := json.Marshal(diag) // 직렬화 ( 구조체 -> JSON 포멧의 Byte[] )
		return ctx.GetStub().PutState(rid, dAsBytes)
	} else {
		return fmt.Errorf("The receipt is not in ready state")
	}
}

// 7. GetHistory upgrade
func (t *SmartContract) GetHistory(ctx contractapi.TransactionContextInterface, rid string) ([]HistoryQueryResult, error) {
	log.Printf("GetAssetHistory: ID %v", rid) // 체인코드 컨테이너 -> docker logs dev-asset1...

	resultsIterator, err := ctx.GetStub().GetHistoryForKey(rid)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQueryResult
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var diag DRecord
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &diag)
			if err != nil {
				return nil, err
			}
		} else {
			diag = DRecord{
				RID: rid,
			}
		}

		timestamp, err := ptypes.Timestamp(response.Timestamp)
		if err != nil {
			return nil, err
		}

		record := HistoryQueryResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			Record:    &diag,
			IsDelete:  response.IsDelete,
		}
		records = append(records, record)
	}

	return records, nil
}

func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error create fabcar chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting fabcar chaincode: %s", err.Error())
	}
}
