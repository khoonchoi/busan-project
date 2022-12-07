// 외부모듈 포함
const express = require('express');
const app = express();
//var bodyParser = require('body-parser');

const { FileSystemWallet, Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');

const fs = require('fs');
const path = require('path');

// 서버설정
const PORT = 3000;
const HOST = '0.0.0.0';
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// fabric 연결설정
const ccpPath = path.resolve(__dirname, 'connection-org1.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

// index.html 페이지 라우팅
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/howdog', async (req, res) => { // (TO DO) url 변경

    try {
        // (TO DO) client로 부터 파리미터 받기
        const cert = req.body.cert;
        const recid = req.body.recid;
        const gardian = req.body.gardian;
        const dinfo = req.body.dinfo;
        const price = req.body.price;

        console.log('/howdog-post-' + cert + '-' + recid + '-' + gardian+ '-' + dinfo + '-' + price);

        // 인증서 확인 -> (TO DO) 전달받은 인증서 사용하기
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const identity = await wallet.get(cert);
        if (!identity) {
            console.log(`An identity for the user ${cert} does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            const result_obj = JSON.parse('{"result":"fail", "error":"An identity for the user does not exist in the wallet"}');
            res.send(result_obj);
            return;
        }

        // GW -> CH -> CC
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: cert, discovery: { enabled: true, asLocalhost: true } });
        const network = await gateway.getNetwork('busanchannel');
        const contract = network.getContract('howdog');
        // (TO DO) changeCarOwner
        await contract.submitTransaction('Register_receipt', recid, gardian, dinfo, price);
        console.log('Transaction has been submitted');
        await gateway.disconnect();

        // submit Transaction -> (TO DO) JSON 형태로 보내주기
        const result_obj = JSON.parse('{"result":"success", "message":"Transaction has been submitted."}');
        res.send(result_obj);

    } catch (error) {
        // client에게 결과 전송 - 실패
        console.log('error occured in generating in submitting a transaction.');
        const result_obj = JSON.parse('{"result":"fail", "error":"error occured in submitting a transaction."}');
        res.send(result_obj);
    }
});

app.post('/howdog', async (req, res) => { // (TO DO) url 변경

    try {
        // (TO DO) client로 부터 파리미터 받기
        const cert = req.body.cert;
        const recid = req.body.recid;
        const vinfo = req.body.vinfo;

        console.log('/howdog-post-' + cert + '-' + recid + '-' + vinfo);

        // 인증서 확인 -> (TO DO) 전달받은 인증서 사용하기
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const identity = await wallet.get(cert);
        if (!identity) {
            console.log(`An identity for the user ${cert} does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            const result_obj = JSON.parse('{"result":"fail", "error":"An identity for the user does not exist in the wallet"}');
            res.send(result_obj);
            return;
        }

        // GW -> CH -> CC
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: cert, discovery: { enabled: true, asLocalhost: true } });
        const network = await gateway.getNetwork('busanchannel');
        const contract = network.getContract('howdog');
        // (TO DO) changeCarOwner
        await contract.submitTransaction('Verify_receipt', recid, vinfo);
        console.log('Transaction has been submitted');
        await gateway.disconnect();

        // submit Transaction -> (TO DO) JSON 형태로 보내주기
        const result_obj = JSON.parse('{"result":"success", "message":"Transaction has been submitted."}');
        res.send(result_obj);

    } catch (error) {
        // client에게 결과 전송 - 실패
        console.log('error occured in generating in submitting a transaction.');
        const result_obj = JSON.parse('{"result":"fail", "error":"error occured in submitting a transaction."}');
        res.send(result_obj);
    }
});



app.get('/howdog', async (req, res) => { // (TO DO) url 변경

    try {
        // (TO DO) client로 부터 파리미터 받기
        const cert = req.query.cert;
        const recid = req.query.recid;

        console.log('/howdog-get-' + cert + '-' + recid);

        // 인증서 확인 -> (TO DO) 전달받은 인증서 사용하기
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const identity = await wallet.get(cert);
        if (!identity) {
            console.log(`An identity for the user ${cert} does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            const result_obj = JSON.parse('{"result":"fail", "error":"An identity for the user does not exist in the wallet"}');
            res.send(result_obj);
            return;
        }

        // GW -> CH -> CC
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: cert, discovery: { enabled: true, asLocalhost: true } });
        const network = await gateway.getNetwork('busanchannel');
        const contract = network.getContract('howdog');
        // (TO DO) GetHistory
        const result = await contract.evaluateTransaction('Query_record', recid);
        console.log('Transaction has been evaluted');
        await gateway.disconnect();

        // submit Transaction -> (TO DO) JSON 형태로 보내주기
        const result_obj = JSON.parse(`{"result":"success", "message":${result}}`);
        res.send(result_obj);

    } catch (error) {
        // client에게 결과 전송 - 실패
        console.log('error occured in generating in submitting a transaction.');
        const result_obj = JSON.parse('{"result":"fail", "error":"error occured in evaluating a transaction."}');
        res.send(result_obj);
    }
});

// /car/history GET 차량정보 이력 ROUTING
app.get('/howdog/history', async (req, res) => { // (TO DO) url 변경

    try {
        // (TO DO) client로 부터 파리미터 받기
        const cert = req.query.cert;
        const recid = req.query.recid;

        console.log('/howdog/history-get-' + cert + '-' + recid);

        // 인증서 확인 -> (TO DO) 전달받은 인증서 사용하기
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        const identity = await wallet.get(cert);
        if (!identity) {
            console.log(`An identity for the user ${cert} does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            const result_obj = JSON.parse('{"result":"fail", "error":"An identity for the user does not exist in the wallet"}');
            res.send(result_obj);
            return;
        }

        // GW -> CH -> CC
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: cert, discovery: { enabled: true, asLocalhost: true } });
        const network = await gateway.getNetwork('busanchannel');
        const contract = network.getContract('howdog');
        // (TO DO) GetHistory
        const result = await contract.evaluateTransaction('GetHistory', recid);
        console.log('Transaction has been evaluted');
        await gateway.disconnect();

        // submit Transaction -> (TO DO) JSON 형태로 보내주기
        const result_obj = JSON.parse(`{"result":"success", "message":${result}}`);
        res.send(result_obj);

    } catch (error) {
        // client에게 결과 전송 - 실패
        console.log('error occured in generating in submitting a transaction.');
        const result_obj = JSON.parse('{"result":"fail", "error":"error occured in evaluating a transaction."}');
        res.send(result_obj);
    }
});

// /admin POST
app.post('/admin', async (req, res) => {
    // client로 부터 params받아오기
    const aid = req.body.id;
    const apw = req.body.pw;

    console.log('/admin-id-' + aid + '-' + apw);

    try {
        // ccp 객체 구성
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // CA 객체 생성과 연결
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
        // 지갑객체 생성과 기등록 admin 인증서 확인
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // 기등록 admin있으면 
        const identity = await wallet.get(aid);
        if (identity) {
            // client에게 결과 전송 - 실패
            console.log('An identity for the admin user admin already exists in the wallet');
            const result_obj = JSON.parse('{"result":"fail", "error":"An identity for the admin user admin already exists in the wallet"}');
            res.send(result_obj);
            return;
        }
        // CA에 관리자 인증서 등록
        const enrollment = await ca.enroll({ enrollmentID: aid, enrollmentSecret: apw });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        // 관리자 인증서 저장
        await wallet.put(aid, x509Identity);
        console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
        // client에게 결과 전송 - 성공
        const result_obj = JSON.parse('{"result":"success", "message":"successfully enrolled admin user admin and imported it into the wallet"}');
        res.send(result_obj);

    } catch (error) {

        // client에게 결과 전송 - 실패
        console.log('error occured in generating a certificate.');
        const result_obj = JSON.parse('{"result":"fail", "error":"error occured in generating a certificate."}');
        res.send(result_obj);
    }
});

// /user POST
app.post('/user', async (req, res) => {
    // client로 부터 params받아오기
    const uid = req.body.uid;
    const urole = req.body.role;
    const udepart = req.body.depart;
    console.log('/user-id-' + uid + '-' + urole + '-' + udepart);
    try {
        // ccp 객체 구성
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        // CA 객체 생성과 연결
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
        // 지갑객체 생성과 기등록 admin 인증서 확인
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        // 기등록 user있으면 
        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get(uid); // userid
        if (userIdentity) {
            console.log('An identity for the user ' + uid + ' already exists in the wallet');
            const result_obj = JSON.parse('{"result":"fail", "error":"An identity for the user already exists in the wallet"}');
            res.send(result_obj);
            return;
        }
        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            const result_obj = JSON.parse('{"result":"fail", "error":"An identity for the admin does not exist in the wallet"}');
            res.send(result_obj);
            return;
        }
        // CA에 사용자 인증서 등록
        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: udepart, // 'org1.department1'
            enrollmentID: uid,
            role: urole// 'client'
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: uid,
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put(uid, x509Identity);
        console.log('Successfully registered and enrolled admin user ' + uid + ' and imported it into the wallet');

        // client에게 결과 전송 - 성공
        const result_obj = JSON.parse('{"result":"success", "message":"successfully enrolled and imported it into the wallet"}');
        res.send(result_obj);

    } catch (error) {

        // client에게 결과 전송 - 실패
        console.log('error occured in generating a certificate.');
        const result_obj = JSON.parse('{"result":"fail", "error":"error occured in generating a certificate."}');
        res.send(result_obj);
    }
});

// 서버시작
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
