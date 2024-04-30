
const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require("body-parser");
const axios = require("axios"); // Import 'axios' instead of 'request'
const moment = require("moment");
const apiRouter = require('./api');
const cors = require("cors");
const fs = require("fs");


const port = 3000;
const hostname = "localhost";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use('/', apiRouter);

const server = http.createServer(app);




// ACCESS TOKEN FUNCTION - Updated to use 'axios'
async function getAccessToken() {
  const consumer_key = ""; // REPLACE IT WITH YOUR CONSUMER KEY
  const consumer_secret = ""; // REPLACE IT WITH YOUR CONSUMER SECRET
  const url =
    "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
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
  
    const accessToken = dataresponse.access_token;
    return accessToken;
  } catch (error) {
    throw error;
  }
}

app.get("/api", (req, res) => {
  res.send("MPESA DARAJA API C2B AND LIPA NA MPESA");
  var timeStamp = moment().format("YYYYMMDDHHmmss");
  console.log(timeStamp);
});


//ACCESS TOKEN ROUTE
app.get("/access_token", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      res.send(" Your access token is " + accessToken);
    })
    .catch(console.log);
});

//MPESA STK PUSH ROUTE
app.get("/stkpush", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const url =
        "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      const auth = "Bearer " + accessToken;
      const timestamp = moment().format("YYYYMMDDHHmmss");
      const password = new Buffer.from(
        //ADD SHORTCODE
        "" +
          "ADD PASSKEY" +
          timestamp
      ).toString("base64");

      axios
        .post(
          url,
          {
            BusinessShortCode: "",//SHORTCODE
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: "",
            PartyA: "", //phone number to receive the stk push
            PartyB: "174379",
            PhoneNumber: "",
            CallBackURL: "https://yoururl/callback",
            AccountReference: "",
            TransactionDesc: "Mpesa Daraja API stk push test",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.send(" Request is successful. Please enter mpesa pin to complete the transaction");
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send(" Request failed");
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
      const url = "https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl";
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            ShortCode: "",
            ResponseType: "Completed",
            ConfirmationURL: "https://yoururl/confirmation",
            ValidationURL: "https://yoururl/validation",
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
          resp.status(500).send(" Request failed");
        });
    })
    .catch(console.log);
});

//confirmation body
app.post("/confirmation",(req,res)=>{
  const mpesaResponse =req.body
  const mpesaResponseString = JSON.stringify(mpesaResponse, null, 2);

  // Write M-Pesa response to a file named 'C2bPesaResponse.json'
  fs.appendFile('C2bPesaResponse.json', mpesaResponseString, (err) => {
    if (err) {
      console.error('Error logging M-Pesa response:', err);
      res.status(500).json({ error: 'Error logging M-Pesa response' });
    } else {
      console.log('M-Pesa response logged successfully');
      res.json({ ResultCode: 0, ResultDesc: 'Confirmation Received Successfully' });
    }
  });
  
})

// Endpoint to retrieve all M-Pesa confirmations
app.get('/confirmation', (req, res) => {
  fs.readFile('C2bPesaResponse.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading M-Pesa response file:', err);
      res.status(500).json({ error: 'Error reading M-Pesa response file' });
    } else {
      // Split the file contents by new lines and filter out empty lines
      const responses = data.split('\n').filter(line => line.trim() !== '');
      res.json(responses);
    }
  });
});


app.post("/validation",(req,res)=>{
  const mpesaResponse =req.body
  const mpesaResponseString = JSON.stringify(mpesaResponse, null, 2);

  // Write M-Pesa response to a file named 'C2bPesaResponse.json'
  fs.appendFile('validationresponse.txt', mpesaResponseString, (err) => {
    if (err) {
      console.error('Error logging M-Pesa response:', err);
      res.status(500).json({ error: 'Error logging M-Pesa response' });
    } else {
      console.log('M-Pesa response logged successfully');
      res.json({ ResultCode: 0, ResultDesc: 'Confirmation Received Successfully' });
    }
  });
});

app.get('/validation', (req, res) => {
  fs.readFile('validationresponse.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading M-Pesa response file:', err);
      res.status(500).json({ error: 'Error reading M-Pesa response file' });
    } else {
      // Split the file contents by new lines and filter out empty lines
      const responses = data.split('\n').filter(line => line.trim() !== '');
      res.json(responses);
    }
  });
});

//only works on sandbox not production
app.get('/simulate', (req, resp) => {
  getAccessToken()
  .then((accessToken)=>{
    const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate"
    const auth = "Bearer " + accessToken;
    axios
    .post(
      url,
      {
        ShortCode: "600984",
              CommandID: "CustomerPayBillOnline",
              Amount: "1",
              Msisdn: "254768140326",
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
        resp.status(500).send(" Request failed");
      });
    });

  });
  
 
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
            PartyB: "",//phone number to receive the stk push
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
          res.status(500).send(" Request failed");
        });
    })
    .catch(console.log);
});



server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
