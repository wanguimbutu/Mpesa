
const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require("body-parser");
const axios = require("axios"); // Import 'axios' instead of 'request'
const moment = require("moment");
const apiRouter = require('./api');
const cors = require("cors");
const fs = require("fs");


const port = 8000;
const hostname = "localhost";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use('/', apiRouter);

const server = http.createServer(app);

var mysql = require('mysql');
var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "admin",
  database: "ca"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("You are connected!");
});
con.end();
// ACCESS TOKEN FUNCTION - Updated to use 'axios'
async function getAccessToken() {
  const consumer_key = "DXgusKXAoII56TNMYrI4gP1RqAV83TXhfT1FwpH4AAMHcyC0"; // REPLACE IT WITH YOUR CONSUMER KEY
  const consumer_secret = "gkAQOCe7eGX6A4XCoMiPMaCOGz7GRsjR1XiJGDSmKaAu3jXfoyLjAwQP4aBt3P98"; // REPLACE IT WITH YOUR CONSUMER SECRET
  const url =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth =
    "Basic " +
    new Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });
   
    const dataresponse = response.data;
    // console.log(data);
    const accessToken = dataresponse.access_token;
    return accessToken;
  } catch (error) {
    throw error;
  }
}

app.get("/", (req, res) => {
  res.send("MPESA DARAJA API WITH NODE JS BY WANGUIMBUTU");
  var timeStamp = moment().format("YYYYMMDDHHmmss");
  console.log(timeStamp);
});


//ACCESS TOKEN ROUTE
app.get("/access_token", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      res.send("😀 Your access token is " + accessToken);
    })
    .catch(console.log);
});

//MPESA STK PUSH ROUTE
app.get("/stkpush", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const url =
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      const auth = "Bearer " + accessToken;
      const timestamp = moment().format("YYYYMMDDHHmmss");
      const password = new Buffer.from(
        "174379" +
          "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" +
          timestamp
      ).toString("base64");

      axios
        .post(
          url,
          {
            BusinessShortCode: "174379",
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: "1",
            PartyA: "254768140326", //phone number to receive the stk push
            PartyB: "174379",
            PhoneNumber: "254768140326",
            CallBackURL: "https://dd3d-105-160-22-207.ngrok-free.app/callback",
            AccountReference: "CA PAY",
            TransactionDesc: "Mpesa Daraja API stk push test",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.send("😀 Request is successful done ✔✔. Please enter mpesa pin to complete the transaction");
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

//STK PUSH CALLBACK ROUTE
app.post("/callback", (req, res) => {
  console.log("STK PUSH CALLBACK");
  const CheckoutRequestID = req.body.Body.stkCallback.CheckoutRequestID;
  const ResultCode = req.body.Body.stkCallback.ResultCode;
  var json = JSON.stringify(req.body);
  fs.writeFile("stkcallback.json", json, "utf8", function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("STK PUSH CALLBACK JSON FILE SAVED");
  });
  console.log(req.body);
});

// REGISTER URL FOR C2B
app.get("/registerurl", (req, resp) => {
  getAccessToken()
    .then((accessToken) => {
      const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            ShortCode: "600998",
            ResponseType: "Complete",
            ConfirmationURL: "http://41.215.83.26:8000/confirmation",
            ValidationURL: "http://41.215.83.26:8000/validation",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          resp.status(200).json(response.data);
          console.log(req.body);
        })
        .catch((error) => {
          console.log(error);
          resp.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

app.get("/confirmation", (req, res) => {
  console.log("All transactions will be sent to this URL");
  console.log(req.body);
});

app.get("/validation", (req, resp) => {
  console.log("Validating payment");
  console.log(req.body);
 
});

app.get('/simulate', (req, resp) => {
  getAccessToken()
  .then((accessToken)=>{
    const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate"
    const auth = "Bearer " + accessToken;
    axios
    .post(
      url,
      {
        ShortCode: "600998",
              CommandID: "CustomerPayBillOnline",
              Amount: "1",
              Msisdn: "254708374149",
              BillRefNumber: "",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
    )
      .then((response) => {
        resp.status(200).json(response.data);
      })
      .catch((error) => {
        console.log(error);
        resp.status(500).send("❌ Request failed");
      });
    });

  });
  
 /* request(
      {
          url: url,
          method: "POST",
          headers: {
              "Authorization": auth
          },
          json: {
              "ShortCode": "600383",
              "CommandID": "CustomerPayBillOnline",
              "Amount": "100",
              "Msisdn": "254708374149",
              "BillRefNumber": "TestAPI"
          }
      },
      function (error, response, body) {
          if (error) {
              console.log(error)
          }
          else {
              res.status(200).json(body)
          }
      }
  )
})*/

// B2C ROUTE OR AUTO WITHDRAWAL
app.get("/b2curlrequest", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const securityCredential =
        "N3Lx/hisedzPLxhDMDx80IcioaSO7eaFuMC52Uts4ixvQ/Fhg5LFVWJ3FhamKur/bmbFDHiUJ2KwqVeOlSClDK4nCbRIfrqJ+jQZsWqrXcMd0o3B2ehRIBxExNL9rqouKUKuYyKtTEEKggWPgg81oPhxQ8qTSDMROLoDhiVCKR6y77lnHZ0NU83KRU4xNPy0hRcGsITxzRWPz3Ag+qu/j7SVQ0s3FM5KqHdN2UnqJjX7c0rHhGZGsNuqqQFnoHrshp34ac/u/bWmrApUwL3sdP7rOrb0nWasP7wRSCP6mAmWAJ43qWeeocqrz68TlPDIlkPYAT5d9QlHJbHHKsa1NA==";
      const url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            InitiatorName: "testapi",
            SecurityCredential: securityCredential,
            CommandID: "PromotionPayment",
            Amount: "1",
            PartyA: "600996",
            PartyB: "254768140326",//phone number to receive the stk push
            Remarks: "Withdrawal",
            QueueTimeOutURL: "https://mydomain.com/b2c/queue",
            ResultURL: "https://mydomain.com/b2c/result",
            Occasion: "Withdrawal",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});