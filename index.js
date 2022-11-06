const express = require('express');
const CryptoJS = require('crypto-js');
const SHA256 = require('crypto-js/sha256');
const Base64 = require('crypto-js/enc-base64');
const request = require('request');
const app = express();
const port = 3000;
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require("cors");
dotenv.config();


app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

async function send_message(username,phone) {
  var user_phone_number = phone; //수신 전화번호 기입
  var user_name = username
  var resultCode = 404;
  const my_number = '01055936691';
  const date = Date.now().toString();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    };
  let createdDate = new Date().toLocaleString('ko-KR', options);
  const uri = process.env.NCP_API_SERVICE_ID_KEY; //서비스 ID
  const secretKey = process.env.NCP_SECRET_KEY; // Secret Key
  const accessKey = process.env.NCP_API_ACCESS_KEY; //Access Key
  const method = 'POST';
  const space = ' ';
  const newLine = '\n';
  const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
  const url2 = `/sms/v2/services/${uri}/messages`;


  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url2);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(accessKey);
  
  const hash = hmac.finalize();
  const signature = hash.toString(CryptoJS.enc.Base64);
  axios({
    method: method,
    // // request는 uri였지만 axios는 url이다
    url: url,
    headers: {
      'Contenc-type': 'application/json; charset=utf-8',
      'x-ncp-iam-access-key': accessKey,
      'x-ncp-apigw-timestamp': date,
      'x-ncp-apigw-signature-v2': signature,
    },
    // request는 body였지만 axios는 data다
    data: {
      type: 'SMS',
      countryCode: '82',
      from: my_number,
      // 원하는 메세지 내용
      content: `${user_name}님 ${createdDate}출석 완료입니다.`,
      messages: [
        // 신청자의 전화번호
        { to: `${user_phone_number}` },
      ],
    },
  })
    .then((res) => {
      console.log(res.status);
    })
    .catch((err) => {
      console.log(err);
    });
  return resultCode;
}


app.post('/sms', async (req, res, next) => {
    
  try {
    // user 정보를 mongodb에 저장한 후
    const paramObj = req.body;
    console.log(req.body)
  res.setHeader('Content-Type', 'application/json');
    // send_message 모듈을 실행시킨다.
    send_message(paramObj.username,paramObj.phone);
    res.send('send message!');
  } catch (err) {
    next(err);
  }
});


app.listen(port, () => {
  console.log('Express server has started on port 3000');
});
