const express = require("express");
const app = express();
const cors = require("cors");
var jwt = require("jsonwebtoken");
const jsSHA = require("jssha");
const request = require("request");
// const sha = new jsSHA("SHA-512", "TEXT");
const bodyParser = require("body-parser");
require("dotenv").config();
app.use(express.json());
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
var pdf = require("pdf-creator-node");
const fs = require("fs");
const path = require("path");
var parser = require("xml2json");
const admzip = require("adm-zip");
const multer = require("multer");
var mammoth = require("mammoth");
const api = "https://phpstack-702151-2512759.cloudwaysapps.com";
const emails = "nookeshkarri7@gmail.com,nishi564baiwa@gmail.com";
var whitelist = [
    "http://localhost:3000",
    "http://ncexams.net",
    "http://exams.navachaitanya.net",
];
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
};

app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
var mysql = require("mysql");
var connection = mysql.createConnection({
    host: "localhost",
    user: "nnekynbxen",
    password: "UsDrU4QFh4",
    database: "nnekynbxen",
});
// console.log(connection);

// console.log(connection);
if (!fs.existsSync("public")) {
    fs.mkdirSync("public");
}
if (!fs.existsSync("public/uploads")) {
    fs.mkdirSync("public/uploads");
}
if (!fs.existsSync("reported")) {
    fs.mkdirSync("reported");
}
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
        cb(
            null,
            "Q.docx"
        );
        console.log(
            (file.originalname)
        );
    },
});

const verifyJwt = (req, res, next) => {
    try {
        const token = req.headers["authorization"];
        console.log(token);
        const verified = jwt.verify(token, "nookenavanishincexams");
        if (verified) {
            req.phone = verified.number;
            next();
        } else {
            // Access Denied
            return res.status(401).send(error);
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send(error);
    }
};

const verifyAdmin = async (req, res, next) => {
    const { phone } = req;
    console.log(phone);
    try {
        await connection.query(
            `CALL verifyAdmin('${phone}')`,
            async function (error, results) {
                if (error) res.send(401).send(error);
                if (results[0][0].result === "success") {
                    next();
                } else {
                    res.send(401).send(error);
                }
            }
        );
    } catch (error) {
        // Access Denied
        return res.status(401).send(error);
    }
};

// async..await is not allowed in global scope, must use a wrapper
async function mailer(htmlData, tit) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    console.log(process.env.GMAIL, process.env.GMAIL_PASS);
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL, // generated ethereal user
            pass: process.env.GMAIL_PASS, // generated ethereal password
            // },
        },
    });

    transporter.set("oauth2_provision_cb", (user, renew, callback) => {
        let accessToken = userTokens[user];
        if (!accessToken) {
            return callback(new Error("Unknown user"));
        } else {
            return callback(null, accessToken);
        }
    });
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: "NavaCHAITANYA Competitions LLP " + process.env.GMAIL, // sender address
        to: emails, // list of receivers
        subject: tit, // Subject line
        text: tit, // plain text body
        html: htmlData, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
// const htmlScript="<b>Hello world?</b>"
// mailer(htmlScript).catch(console.error);
const year = new Date().getFullYear();
const month = new Date().getMonth();
const day = new Date().getDate() - 1;
console.log(new Date());
const dateSche = new Date(year, month, day, 08, 59, 11)
    .toISOString()
    .split("T")[0];
const scheduleTIme = new Date(year, month, day + 1, 00, 29, 00);
console.log(scheduleTIme);
schedule.scheduleJob(scheduleTIme, async function () {
    console.log("The answer to life, the universe, and everything!");
    await connection.query(
        `call getPaymentDataCsv('${dateSche}')`,
        async function (error, results) {
            console.log(error, results);
            if (results[0].length > 0 && results[0] != undefined) {
                const title = `Payment Report on ${scheduleTIme}`;
                const htmlScript = `<p><b>Report Date: </b>${results[1][0].datefrom}</p>
        <p><b>No of Payments : </b>${results[1][0].total}</p>
        <p><b>Total Amount Recived : </b>${results[1][0].amount}</p>
        <br />
        <div>
          <a
            href="https://exams.navachaitanya.net/export-payment-data/${dateSche}"
            style="
              background-color: blue;
              color: white;
              padding: 10px;
              border-radius: 20px;
            "
            >Download Excel File</a
          >
        
        </div>
        `;
                mailer(htmlScript, title);
                console.log(mailer(htmlScript, title));
            } else {
                const title = `Payment Report on ${scheduleTIme}`;
                const htmlScript = `<p><b>Report Date: </b>${results[1][0].datefrom}</p>
        <p><b>No of Payments : </b>${results[1][0].total}</p>
        <p><b>Total Amount Recived : </b>0</p>
        <br />
        <p>No Payments are done </p>
        `;
                mailer(htmlScript, title);
            }
        }
    );
});

var compressfilesupload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 100 },
});
var reportstorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const { question } = req.headers;
        if (!fs.existsSync(`reported/${question}`)) {
            await fs.mkdirSync(`reported/${question}`);
        }
        const storeLink = "reported/" + question;
        cb(null, storeLink);
    },
    filename: function (req, file, cb) {
        const { linkfile } = req.headers;
        cb(null, linkfile);
    },
});
var reportcompressfilesupload = multer({
    storage: reportstorage,
});


app.post(
    "/upload-doc",
    verifyJwt,
    verifyAdmin,
    compressfilesupload.array("file", 1),
    async (req, res) => {
        if (req.files) {
            console.log("test==>", req.files);

            mammoth
                .convertToHtml({ path: req.files[0].path })
                .then(async function (result) {
                    var data = result.value;
                    const allcategoryQ = data.split("CATEGORY:").slice(1)
                    const allQuestions = []
                    allcategoryQ.forEach((each) => {
                        const categroyName = each.split(/Q:[0-9]+\)/)[0].split(",")[0].toString().trim()
                        const eachQUestion = each.split(/Q:[0-9]+\)/).slice(1).map((eachQ) => {
                            const question = eachQ.split(/[A-Z]:\)/)[0]

                            const options = eachQ.split(/[A-Z]:\)/).slice(1).map((q, i) => q.includes("<strong>") ? '<p>' + q.replace("<p>", '') + '$$1' : '<p>' + q.replace("<p>", '') + '$$0')
                            return ({
                                Q: '<p>' + question,
                                options,
                                categoryId: parseInt(categroyName.trim())
                            })
                        })

                        eachQUestion.forEach(async (eachQue) => {
                            const { Q, options, categoryId } = eachQue
                            console.log(eachQue)
                            await connection.query(
                                `call spAdminUploadQuestions('Question','${Q}','',${categoryId})`,
                                async function (error, results) {

                                    options.forEach(async (opti) => {
                                        let eachOP = opti.toString()
                                        console.log(`call spAdminUploadQuestions('Options','${eachOP.split("$$")[0]}','${eachOP.split("$$")[1]}',${results[0][0].qID})`)
                                        await connection.query(
                                            `call spAdminUploadQuestions('Options','${eachOP.split("$$")[0].replace("<strong>", '').replace("</strong>", '')}','${eachOP.split("$$")[1]}',${results[0][0].qID})`,
                                            async function (error, results) {
                                                if (results) return true
                                                return false

                                            }
                                        );
                                    })
                                }
                            );
                        })
                    })
                    fs.unlinkSync(req.files[0].path)
                    res.send(true)
                }).done();
        }
    }
);
app.post(
    "/report-upload-image",
    verifyJwt,
    reportcompressfilesupload.single("file"),
    async (req, res) => {
        if (req.files) {
            res.send("file uploaded successfully");
        }
    }
);

app.get("/quiz_details/:quid", verifyJwt, async (request, response) => {
    const { quid } = request.params;
    const { phone } = request;
    console.log(phone);
    await connection.query(
        `call getquiz('${quid}','${phone}')`,
        async function (error, results) {
            if (error) response.send(error);
            response.send(JSON.stringify([...results, ...[{ phone: phone }]]));
        }
    );
});

app.get("/all-result-list/", verifyJwt, async (request, response) => {
    const { phone } = request;
    console.log(phone);
    await connection.query(
        "call getallresults(" + phone + ")",
        async function (error, results) {
            if (error) response.send(error);
            response.send(JSON.stringify(results));
        }
    );
});

app.get("/all-exam-schedules", verifyJwt, async (request, response) => {
    const { phone } = request;
    console.log(phone);
    await connection.query(
        "call getExamSchedules()",
        async function (error, results) {
            if (error) response.send(error);
            response.send(JSON.stringify(results));
        }
    );
});

app.post("/update-user-details", verifyJwt, async (request, response) => {
    const { phone } = request;
    const { type } = request.body;
    await connection.query(
        `CALL spGetEditUser('${phone}','${type}')`,
        async function (error, results) {
            if (error) response.send(error);
            response.send(results);
        }
    );
});

app.post(
    "/report-question/:quizId/:qid",
    verifyJwt,
    async (request, response) => {
        const { phone } = request;
        const { msg } = request.body;
        const { quizId, qid } = request.params;
        const { fileurl } = request.headers;

        await connection.query(
            `CALL reportQuestion('${phone}',${quizId},${qid},'${msg}','${fileurl}')`,
            async function (error, results) {
                if (error) response.send(error);
                console.log(results[0][0].result);
                const reportMsg = results[0][0].result;
                if (reportMsg !== "error") {
                    const title = "New Question Reported By Student...";
                    const htmlScript = `<p><b>Exam Name : </b>${results[0][0].quiz_name}</p>
        <p><b>Reported by :</b> ${phone}</p>
        <br />
        <div>
          <a
            href="https://exams.navachaitanya.net/admin/qbank/reported-questions/${quizId}/${results[0][0].id}"
            style="
              background-color: blue;
              color: white;
              padding: 10px;
              border-radius: 20px;
            "
            >Edit Question</a
          >
        
          <a
            href="${fileurl}"
            style="
              background-color: blue;
              color: white;
              padding: 10px;
              border-radius: 20px;
            "
            >Check proof Image</a
          >
        </div>
        `;
                    mailer(htmlScript, title).catch(console.error);
                }
                response.send(results);
            }
        );
    }
);

app.post("/verify-user", async (request, response) => {
    const { number } = request.body;
    await connection.query(
        `SELECT * FROM savsoft_users Where contact_no=${number}`,
        async function (error, results) {
            if (error) response.send(error);
            response.send(results);
        }
    );
});
app.post("/get-group-quizzes/:guid", verifyJwt, async (request, response) => {
    const { guid } = request.params;
    const { phone } = request;
    console.log(request.phone);
    await connection.query(
        `CALL getGroupQuizList('${phone}','${guid}')`,
        async function (error, results) {
            if (error) response.send(error);
            response.send(results);
        }
    );
});
app.post("/get-group-details/:gid", async (req, res) => {
    const { gid } = req.params;
    await connection.query(
        `SELECT gr.*,scheduleLink FROM savsoft_group gr LEFT JOIN
    (	SELECT gid,drive_link scheduleLink
          from
    t_exam_schedules 
    WHERE category='schedule') sch on sch.gid=gr.gid
    where gr.gid=${gid}`,
        async function (error, results) {
            // res.send(error);
            res.send(results);
        }
    );
});
app.post("/generate-user-token", async (request, response) => {
    const { number } = request.body;

    await connection.query(
        `SELECT * FROM savsoft_users Where contact_no=${number}`,
        async function (error, results) {
            if (error) response.send(error);
            var token = await jwt.sign({ number }, "nookenavanishincexams");
            response.send({ result: results, jwt: token });
        }
    );
});

app.post("/create-new-user", async (request, response) => {
    const { name, surname, email, district, dob, number, type } = request.body;
    if (type === "CREATE") {
        let token = "";
        await connection.query(
            `CALL createUpdateUser('${name}', '${email}', '${surname}', '${district}','${dob}', '${number}','${type}')`,
            async function (err, resu) {
                if (err) response.send(err);
                token = await jwt.sign({ number }, "nookenavanishincexams");
            }
        );
        await connection.query(
            `SELECT * FROM savsoft_users Where contact_no=${number}`,
            async function (error, results) {
                if (error) response.send(error);
                response.send({ result: results, jwt: token });
            }
        );
    } else {
        await connection.query(
            `CALL createUpdateUser('${name}', '${email}', '${surname}', '${district}','${dob}', '${number}','${type}')`,
            async function (err, resu) {
                if (err) response.send(err);
                response.send(resu);
            }
        );
    }
});

app.post("/get-user-details/:uid", async (request, response) => {
    const { uid } = request.params;
    await connection.query(
        `CALL getUserInfo('${uid}')`,
        async function (error, results) {
            if (error) response.send(error);
            response.send({ result: results[0] });
        }
    );
});

app.get("/get-packages-list", async (request, response) => {
    await connection.query(
        "call getUserPackages() ",
        async function (error, results) {
            if (error) response.send(error);
            response.send(JSON.stringify(results[0]));
        }
    );
});

app.post("/all-test-results/view", async (request, response) => {
    const { quid } = request.params;
    // const quizNo = parseInt(quid);
    // response.send(quid);

    await connection.query(
        "SELECT * FROM test_result order by rid desc",
        async function (error, results) {
            if (error) response.send(error);

            response.send(JSON.stringify(results));
        }
    );
});
app.get(
    "/view-result/:phone/:quid/:rid",
    verifyJwt,
    async (request, response) => {
        const { quid, rid, phone } = request.params;
        await connection.query(
            `call getResult(${quid}, ${rid},'${phone}')`,
            async function (error, results) {
                if (error) response.send(error);
                response.send(JSON.stringify(results));
            }
        );
    }
);

app.post(
    "/quiz-attempt/submit-quiz/:quid",
    verifyJwt,
    async (request, response) => {
        const { quid } = request.params;
        const { phone } = request;
        const { starttime, endtime, scoreTotal, scorei } = request.body;
        // response.send(quid);

        await connection.query(
            `CALL storeAnswers(${quid},${scoreTotal},'${scorei}','${starttime}','${endtime}','${phone}')`,
            async function (error, results) {
                if (error) response.send(error);
                response.send(JSON.stringify(results[0]));
            }
        );
    }
);

app.post("/payment_gateway/payumoney/success", async (req, res) => {
    const {
        status,
        firstname,
        net_amount_debit,
        phone,
        productinfo,
        txnid,
        addedon,
    } = req.body;
    console.log(
        `CALL storePaymentDetails('${status}','${firstname}','${net_amount_debit}',${phone},'${txnid}','${addedon}','${productinfo.split("date")[0]
        }','${productinfo.split("date")[1]}')`
    );
    const title = `Payment received for amount Rs. ${net_amount_debit}`;
    const htmlScript = `<p><b>Paid Date: </b>${addedon}</p>
        <p><b>Transaction Id : </b>${txnid}</p>
        <p><b>Student Name : </b>${phone}</p>
        <p><b>Student Phone Number : </b>${firstname}</p>
        <br />
        <br />
        Team,
        ???????? ????????????...
        `;
    mailer(htmlScript, title);
    console.log(mailer(htmlScript, title));
    await connection.query(
        `CALL storePaymentDetails('${status}','${firstname}','${net_amount_debit}',${phone},'${txnid}','${addedon}','${productinfo.split("date")[0]
        }','${productinfo.split("date")[1]}')`,

        async function (error, results) {
            if (results)
                return res.redirect(
                    `https://exams.navachaitanya.net`
                );
            // return res.redirect(
            //   `http://localhost:3000/exams-list/${productinfo}?message="Your Package Activated Successfully.."`
            // );
        }
    );
});
app.post("/payment_gateway/free/success", verifyJwt, async (req, res) => {
    const {
        status,
        firstname,
        net_amount_debit,
        phone,
        productinfo,
        txnid,
        addedon,
        validity,
    } = req.body;
    await connection.query(
        `CALL storePaymentDetails('${status}','${firstname}','${net_amount_debit}',${phone},'${txnid}','${addedon}','${productinfo}','${validity}')`,
        async function (error, results) {
            if (results) res.send(results);
        }
    );
});

app.post("/payment_gateway/payumoney/fail", async (req, res) => {
    return res.redirect(
        `https://exams.navachaitanya.net/payment-failed?message="Payment Failed"`
    );
});

app.post("/get-group-details/:gid", async (req, res) => {
    const { gid } = req.params;
    await connection.query(
        `SELECT group_name,price,valid_for_days FROM savsoft_group where gid=${gid}`,
        async function (error, results) {
            // res.send(error);
            res.send(results);
        }
    );
});

app.post("/get-discount-coupon-details/:coupon/:gid", async (req, res) => {
    const { coupon, gid } = req.params;
    await connection.query(
        `SELECT amount FROM discount_coupon  WHERE name='${coupon}' AND FIND_IN_SET('${gid}', groupIds)`,
        async function (error, results) {
            // res.send(error);
            res.send(results);
        }
    );
});

// Admin

app.get(
    "/dashboard/:page",
    verifyJwt,
    verifyAdmin,
    async (request, response) => {
        const { page } = request.params;
        console.log(page);
        await connection.query(
            `call getDashboardData(${parseInt(page) * 10})`,
            async function (error, results) {
                if (error) response.send(error);
                response.send(JSON.stringify(results));
            }
        );
    }
);

app.get(
    "/adminmasterdata/:type",
    verifyJwt,
    verifyAdmin,
    async (request, response) => {
        const { type } = request.params;
        await connection.query(
            `call adminMaster('${type}')`,
            async function (error, results) {
                if (error) response.send(error);
                response.send(JSON.stringify(results));
            }
        );
    }
);

app.post(
    "/admin/create-new-user",
    verifyJwt,
    verifyAdmin,
    async (request, response) => {
        const {
            name,
            surname,
            email,
            district,
            dob,
            number,
            type,
            su,
            gidselected,
        } = request.body;

        await connection.query(
            `CALL AdmincreateUpdateUser('${name}', '${email}', '${surname}', '${district}','${dob}', '${number}','${type}',${su},'${gidselected}')`,
            async function (err, resu) {
                if (err) response.send(err);
                response.send(resu);
            }
        );
    }
);

const deleteDirectory = async (dir) => {
    // delete directory recursively
    try {
        fs.rmdirSync(dir, { recursive: true });
        console.log(`${dir} is deleted!`);
    } catch (err) {
        console.error(`Error while deleting ${dir}.`);
    }
};
app.post(
    "/admin/qbankdata",
    verifyJwt,
    verifyAdmin,
    async (request, response) => {
        const { type, search, qid } = request.body;

        await connection.query(
            `CALL adminQbankData('${type}', '${search}', '${qid}')`,
            async function (err, resu) {
                if (err) response.send(err);
                response.send(resu);
            }
        );
        if (type === "reportedDelete") {
            deleteDirectory("reported/" + qid);
        }
    }
);

app.post("/support", async (request, response) => {
    const { type, search, qid } = request.body;
    await connection.query(
        `CALL supportHome('${type}', '${search}', '${qid}')`,
        async function (err, resu) {
            if (err) response.send(err);
            response.send(resu);
        }
    );
});

app.post(
    "/admin/add-edit-question",
    verifyJwt,
    verifyAdmin,
    async (request, response) => {
        const {
            questionText,
            op1,
            op2,
            op3,
            op4,
            op1Num,
            op2Num,
            op3Num,
            op4Num,
            selectedCat,
            correctOption,
            qNum,
            quizId,
            type,
            op5,
            op5Num,
        } = request.body;

        await connection.query(
            `CALL AdminAddEditQuestion('${type}','${questionText}', '${op1}', '${op2}', '${op3}','${op4}', '${selectedCat}','${correctOption}',${qNum},'${quizId}',${op1Num},${op2Num},${op3Num},${op4Num},'${op5}',${op5Num})`,
            async function (err, resu) {
                if (err) {
                    response.send(err);
                } else {
                    response.send(resu);
                    if (String(type).split(",")[0] === "EDITREPORTED") {
                        deleteDirectory("reported/" + qNum);
                    }
                }
            }
        );
    }
);

app.post(
    "/admin/add-edit-group",
    verifyJwt,
    verifyAdmin,
    async (request, response) => {
        const {
            schedule,
            description,
            name,
            price,
            validity,
            groupOrder,
            groupId,
            enabled,
            type,
            syllabus,
        } = request.body;

        await connection.query(
            `CALL AdminAddEditPackage('${type}','${schedule}', '${description}', '${name}', ${price},${validity}, ${groupOrder},${groupOrder},${groupId},${enabled},'${syllabus}')`,
            async function (err, resu) {
                if (err) response.send(err);
                response.send(resu);
            }
        );
    }
);

app.post(
    "/admin/add-edit-exam",
    verifyJwt,
    verifyAdmin,
    async (request, response) => {
        const {
            type,
            examid,
            name,
            startdate,
            enddate,
            duration,
            attempts,
            selectedGids,
            description,
            selectedqids,
            noq,
            minPercent,
        } = request.body;

        await connection.query(
            `CALL AdminAddEditExams('${type}',${examid}, '${name}', '${startdate}', '${enddate}', '${duration}',${attempts}, '${selectedGids}','${description}','${selectedqids}',${noq},${minPercent})`,
            async function (err, resu) {
                if (err) response.send(err);
                response.send(resu);
            }
        );
    }
);

// app.get("/realtime-users", verifyJwt, verifyAdmin, async (re, res) => {
//   // Imports the Google Cloud client library.

//   const propertyId = "258958975";
//   // Imports the Google Analytics Data API client library.
//   const { BetaAnalyticsDataClient } = require("@google-analytics/data");

//   // Creates a client.
//   const analyticsDataClient = new BetaAnalyticsDataClient();

//   // Runs a realtime report.
//   try {
//     async function runRealtimeReport() {
//       const [response] = await analyticsDataClient.runRealtimeReport({
//         // The property parameter value must be in the form `properties/1234`
//         // where `1234` is a GA4 property Id.
//         property: `properties/${propertyId}`,
//         dimensions: [
//           {
//             name: "country",
//           },
//         ],
//         metrics: [
//           {
//             name: "activeUsers",
//           },
//         ],
//       });

//       console.log("Report result:");
//       response.rows.forEach((row) => {
//         console.log(row.dimensionValues[0], row.metricValues[0]);
//       });
//       res.send(JSON.stringify(response));
//     }
//     runRealtimeReport();
//   } catch (err) {
//     console.log(err);
//   }
// });
app.get("/export-payment-details/:date", async (request, response) => {
    const { date } = request.params;
    await connection.query(
        `call getPaymentDataCsv('${date}')`,
        async function (error, results) {
            if (error) response.send(error);
            response.send(results);
        }
    );
});
app.get("/download-pdf/:type/:quid/:text", async (request, response) => {
    const { quid, type } = request.params;
    var html = fs.readFileSync("public/templates/leaderboard.html", "utf8");
    var options = {
        format: "A4",
        orientation: "portrait",
        border: "0mm",
        // header: {
        //   height: "45mm",
        //   contents: '<div style="text-align: center;">Author: Shyam Hajare</div>',
        // },
    };
    // let data = null;
    const data = await connection.query(
        `call getPdfdata('${type}',${quid})`,
        async function (error, results) {
            if (error) console.log(error);
            console.log(results[0]);

            if (type === "questiondata") {
                const questions = [];
                results[1].forEach((element) => {
                    questions.push({
                        question: element.question,
                        qNum: element.qNUm,
                        options: element.options.split(",").map((op) => {
                            op: op;
                        }),
                        correct: element.correct
                            .split(",")
                            .filter((e) => e.split("score")[1] == " 1]")
                            ? element.correct
                                .split(",")
                                .filter((e) => e.split("score")[1] == " 1]")[0]
                                .split("score")[0]
                                .trim()
                            : "",
                    });
                });
                var document = {
                    html: html,
                    data: {
                        questions: questions,
                        header: results[0][0].quiz_name,
                    },
                    path: "public/leaderboard.pdf",
                    type: "",
                };
                console.log(document.data);
            } else {
                var document = {
                    html: html,
                    data: {
                        users: results[1],
                        toppers: results[1].slice(0, 3),
                        header: results[0][0].name,
                    },
                    path: "public/leaderboard.pdf",
                    type: "",
                };
            }

            console.log(data);
            var options2 = {
                root: path.join(__dirname + "/public/"),
            };
            pdf
                .create(document, options)
                .then((res) => {
                    response.sendFile("leaderboard.pdf", options2, function (err) {
                        if (err) {
                            return res.status(401).send(error);
                        } else {
                            fs.unlinkSync(options2.root + "leaderboard.pdf");
                        }
                    });
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    );
});

app.post("/support", async (request, response) => {
    const { type, search, qid } = request.body;
    await connection.query(
        `CALL supportHome('${type}', '${search}', '${qid}')`,
        async function (err, resu) {
            if (err) response.send(err);
            response.send(resu);
        }
    );
});
app.get(
    "/get-user-payments-data/:type",
    verifyJwt,
    async (request, response) => {
        const { type } = request.params;
        const { phone } = request;

        await connection.query(
            `call spGetUserPaymentData('${type}','${phone}')`,
            async function (error, results) {
                if (error) response.send(error);
                response.send(JSON.stringify(results));
            }
        );
    }
);
app.get(
    "/download-payment-reciept/:gid/:num/:text",
    async (request, response) => {
        const { gid, num } = request.params;
        await connection.query(
            `call spGetUserPaymentData('${gid}','${num}')`,
            async function (error, results) {
                connection.release();
                if (error) response.send(error);
                var html = fs.readFileSync("public/templates/payment.html", "utf8");
                var options = {
                    format: "A4",
                    orientation: "portrait",
                    border: "0mm",
                    // header: {
                    //   height: "45mm",
                    //   contents: '<div style="text-align: center;">Author: Shyam Hajare</div>',
                    // },
                };
                var document = {
                    html: html,
                    data: {
                        data: results[0][0],
                    },

                    path: "public/payment.pdf",
                    type: "",
                };
                document.data.data.expiry_date =
                    new Date(document.data.data.expiry_date).getDate() +
                    " / " +
                    new Date(document.data.data.expiry_date).getMonth() +
                    " / " +
                    new Date(document.data.data.expiry_date).getFullYear();
                var options2 = {
                    root: path.join(__dirname + "/public/"),
                };
                pdf
                    .create(document, options)
                    .then((res) => {
                        response.sendFile("payment.pdf", options2, function (err) {
                            if (err) {
                                return res.status(401).send(error);
                            } else {
                                fs.unlinkSync(options2.root + "payment.pdf");
                            }
                        });
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        );
    }

);

app.listen(4002, () => console.log("port running"));
