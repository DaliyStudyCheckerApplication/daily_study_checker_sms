const express = require('express');
const CryptoJS = require('crypto-js');
const SHA256 = require('crypto-js/sha256');
const Base64 = require('crypto-js/enc-base64');
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
  let user_phone_number = phone; //수신 전화번호 기입
  let user_name = username
  let resultCode = 404;
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

async function getmembers(date,sendTime,checkTime){
  
  axios({
      method: 'post',
      url: 'http://ec2-3-37-180-254.ap-northeast-2.compute.amazonaws.com:8080/api/v1/members/ontime',
      data: {
        date: date,
        sendTime: sendTime,
        checkTime: checkTime
      }
    }).then((res) => {
      const data = res.data.data.members;
      console.log(data);
      for(let i = 0; i<data.length;i++){
        send_message(data[i].memberName,data[i].memberPhoneNumber);
      }
    })
    .catch((err) => {
      console.log(err);
    });
    return 404;
    
}


app.post('/sms', async (req, res, next) => {
    
  try {
    const curr = new Date();
    const utc = curr.getTime() + (curr.getTimezoneOffset() * 60 * 1000);
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const date = new Date(utc + KR_TIME_DIFF);

    let date1 = `${date.getFullYear()}-${date.getDate()+1}-${date.getDate()}`;
    let sendTime = `${date.getUTCHours()}:${date.getUTCMinutes()}`;
      if(date.getUTCMinutes()<10){
        sendTime = `${date.getUTCHours()}:0${date.getUTCMinutes()}`;
        }
    let checkTime = `${date.getUTCHours()}:${date.getUTCMinutes()+30}`;
      if(date.getUTCMinutes()>=30){
        checkTime = `${date.getUTCHours()+1}:${date.getUTCMinutes()-30}`;
        }
    
    getmembers(date1,sendTime,checkTime);
    res.send('send message!');
  } catch (err) {
    next(err);
  }
});


app.listen(port, () => {
  console.log('Express server has started on port 3000');
});
