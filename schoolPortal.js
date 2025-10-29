const {Pool} = require('pg');
const path=require('path');
const bcrypt=require('bcryptjs')
const ejs=require('ejs');
const express = require('express');
const session=require('express-session')
const app= express();
const cors=require('cors');
const {parse} = require('json2csv');
const pdfDoc= require('pdfkit');
// const paystack=require('paystack');
const { rejects, ok } = require('assert');
const { get } = require('http');
const bcryptjs = require('bcryptjs');
const memory=require('memory-cache');
const { emit } = require('process');
const paystack=require('paystack')('sk_test_396704ef8cb1fda1c5de2f7df32c1029860fb5da');;
const twilio=require('twilio');
app.use(express.json())
app.use(cors())
app.use(
    session({
        resave:false,
        saveUninitialized:true,
        cookie:{secure:false},
        secret:'passp'
    })
)

let pool= new Pool({
    host:'localhost',
    database:'erin',
    password:'passp',
    user:'erink',
    port:5432
})

app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname))

async function table() {
    try{
await pool.connect();

let tab=`
create table if not exists serl(
id serial primary key,
FirstName varchar(50) not null,
LastName varchar(50)  not null,
age integer  not null,
email varchar(44) unique not null,
password varchar(60) not null,
role varchar(15) not null,
created_at timestamp default current_timestamp
)
`

let newTab=`
create table if not exists grades(
id serial primary key,
student_id integer references serl(id) on delete cascade,
subject varchar(30),
grades varchar(10),
created_at timestamp default current_timestamp
)
`
await pool.query(tab);
await pool.query(newTab);

console.log('Table Created Successfully')
    }catch(err){
        if(err) throw err
    }
}

app.use(express.static(path.join(__dirname,'static')))

app.get('/',(req,res)=>{
res.sendFile(path.join(__dirname, 'static' ,'schoolPortal.html'))
})

app.get('/registration.html',(req,res)=>{
res.sendFile(path.join(__dirname ,'static','registration.html'))
})

app.post('/register',async (req,res)=>{
const {FirstName,LastName,email,age,password,role,subject,selClass} = req.body;
console.log(FirstName,LastName,email,age,password,role,subject,selClass)
let hashed= await bcrypt.hash(password,10)

let checkQuery={
    texts:'select * from serl where email=$1',
    vals:[email]
}

const {texts,vals}=checkQuery

const tot=await pool.query(texts,vals);
if(tot.rows.length === 'undefined'){
    console.log("Inaccurate response")
}
    else if(tot.rows.length >0) {
       return res.json({msg:"Email used already try a new one"})
    }else if(subject){
        console.log("Working for teacher login is perfect !")
        const querd={
            Qtext:'insert into serl(FirstName,LastName,age,email,password,role,subject) values($1,$2,$3,$4,$5,$6,$7)',
            Qvalues:[FirstName,LastName,age,email,hashed,role,subject]
        }        
        const {Qtext,Qvalues} = querd;

        await pool.query(Qtext,Qvalues);
       return res.json({red:'/Login.html'})
    }
    else{
        const query={
            text:'insert into serl(FirstName,LastName,age,email,password,role,studClass) values($1,$2,$3,$4,$5,$6,$7)',
            values:[FirstName,LastName,age,email,hashed,role,selClass]
        }

        const {text,values} = query;
        console.log(LastName,FirstName,email,age,role);
        let enter=memory.put('regData',{LastName,FirstName,email,age,role,subject});
        console.log("the student data "+enter.LastName,enter.FirstName,enter.email,enter.age,enter.role,enter.subject);
        await pool.query(text,values);        
        return res.json({redi:'/Login.html'});
    }
         if(role === 'administrative'){
           return res.json({admin:'/admin'});
        }else if(role === 'pay'){
            return res.json({payIt:'/studentPayment.html'})
        }        
        else{
            return res.send('No page to load for you.')
        }
})
 
app.post('/login', async (req,res)=>{
const {FirstName,LastName,age,email,password,role,subject} = req.body;

if(FirstName && LastName && age && email && password && role){
 console.log('Good to go');
}

let resuls= await pool.query('select * from serl where email=$1 and firstname=$2 and lastname=$3',[email,FirstName,LastName])
let dats= await resuls.rows[0] || [];

if(!dats){
    return res.send('NO such email')
}

let passWordMatch= bcrypt.compareSync(password,dats.password);
if(passWordMatch){
    memory.put('loginData',{FirstName,LastName,age,email,password,role});
    if(subject){
        memory.put('loginData',{FirstName,LastName,age,email,password,role,subject});
        let loginData= memory.get('loginData');
        console.log('This is login Data ',loginData.FirstName,loginData.LastName,loginData.age,loginData.email,loginData.role,loginData.subject); 
    }
    let loginData= memory.get('loginData');
    console.log('This is login Data ',loginData.FirstName,loginData.LastName,loginData.age,loginData.email,loginData.role) 

    if(loginData){
        console.log('Working:')
    }        else{
        console.log('NOt working')
    }
    if(loginData.role === 'student'){
        res.redirect('./stud.html')
    }
    else if(loginData.role === 'teacher' && loginData.subject){
        res.redirect('./teacher.html')
    }else if(loginData.role === 'pay'){
        res.redirect('./stud.html');
    }
}else{
    return res.status(401).send('Error in Logging in ,No available page...')
}
})

app.get('/user', (req, res) => {
    const regData=memory.get('regData');
    if (!regData) {
        return console.error("Error in /user");
    }

    res.json({
        firstName: regData.FirstName,
        lastName: regData.LastName,
        role: regData.role,
        email: regData.email
    });
    console.log('User Data...'+regData.FirstName,regData.LastName,regData.role,regData.email)
});

app.get('/loginTeacher',async(req,res)=>{
    const regData=memory.get('loginData');
    if(!(regData && regData.role === 'teacher')){
        return console.log("No data for the logging in of the user")
    }
        res.json({
        firstName: regData.FirstName,
        lastName: regData.LastName,
        role: regData.role,
        email: regData.email,
        subject:regData.subject
    });
    console.log(' Loggin in data '+ regData.FirstName,regData.LastName,regData.role,regData.email)
});

app.get('/loginStudent',async(req,res)=>{
  const logData=memory.get("loginData");
  if(!logData){
    return console.log("No logged Data...");
  }  
  if(logData.role === 'student'){
            res.json({
        firstName: logData.FirstName,
        lastName: logData.LastName,
        role: logData.role,
        email: logData.email,
        subject:logData.subject
    });
  }else{
    console.log("Error in finding student login...")
  }
});
    app.post('/student',async (req,res)=>{
        const {email,year,term} = req.body;
        let logData=memory.get('loginData');
        console.log(year,term);
            console.log("I am working");
            let qrew={
                ttt:`select * from grades where email=$1 and term =$2 and year=$3`,
                vall:[email,term,year]
            };
            try{
            const {ttt,vall} = qrew;
            let shofs=await pool.query(ttt,vall)
            console.log('here is the table'+ shofs.rows);
            let remy= shofs.rows
            res.json({
                remy:remy
            });
            if(remy.length === 0){
            console.log("Rows are not available");
            }
            }catch(err){
         if(err){
            console.error("Error in sending student Data...");
            return res.json({StudentDataErr:'Error in retrieving student Data...'});
                }
}
});

    app.post('/submitGrade', async (req, res) => {
        try {
        const {subject,grade,term,year,email,seleClass,studentName} = req.body;
        console.log('Submit grade data: ',subject,grade,term,year,email,seleClass,studentName);
        if (!( subject && grade && term && year)) {
            return res.send("Enter all fields");
        }
        const check={
            checkTxt:'select * from grades where subject=$1 and term=$2 and year=$3 and studClass=$4 and email=$5',
            checkVal:[subject,term,year,seleClass,email]
        }
        const {checkTxt,checkVal} = check;
        const dart=await pool.query(checkTxt,checkVal);
        if(dart.rows.length >= 1){
            console.log("Student already has a grade.");
            return res.json({ErrMsg:`${studentName} already has a grade for ${subject}:${term}/${year}/${seleClass}`});
        }

        const query = {
            text: `INSERT INTO grades(subject, grades,term,year,email,studclass,studname) VALUES($1, $2, $3,$4,$5,$6,$7)`,
            values: [ subject, grade,term,year,email,seleClass,studentName]
        };
            await pool.query(query.text,query.values);
            return res.json({successful:"grade successfully uploaded."});
        } catch (error) {
            console.error("Error in submitting data from server ",error);
        }
    });    

    app.get('/getData',async(req,res)=>{
        const {selectedClass}= req.query;
        console.log('Get data product: ',selectedClass);
        const check={
            checkTxt:'select * from serl where role=$1 and studclass=$2',
            checkVal:['student',selectedClass]
        }
        const {checkTxt,checkVal} = check;
        let sendData=await pool.query(checkTxt,checkVal);
        res.json({data:sendData.rows});
    });

app.get('/getEmail',async(req,res)=>{
    const {email} = req.body;
    const check={
        checkText:'select * from serl where email=$1',
        checkVal:[email]
    }
    const {checkText,checkVal} = check;
    let son=await pool.query(checkText,checkVal);
    if(son.rows <1 ){
        console.log("Email not found")
        return res.json({EmailErr:'Email not found...'})
    }else if(son.rows.length > 1){
        console.log("Email already used...")
        return res.json({EmailDup:'Email already used...'})
    }else{
        console.log("Sent email successfully...")
        res.json({Email:son.rows});
    }
})

 app.post('/payment',async(req,res)=>{
    try{
        const {email,reference,amount} = req.body;
        if(!email || !reference || !amount){
            res.json({
                ErrMsg:'Error ! ensure all fields are filled.'
            })
        }
        const transactionData={
            email:email,
            reference:reference,
            amount:amount
        }
        const InitializePayment=async()=>{
            return new Promise((reject,resolve)=>{
            paystack.transaction.initialize(transactionData,(err,res)=>{
                if(err){
                    reject(err)
                }
                resolve(res.data);
            })
        })
        }
        InitializePayment();
        res.json({
            successPay:"Payment Successful."
        });
    }catch(err){
        console.log("Error in creating transaction...");
    }
})

const verif=async()=>{
    const logData=memory.get('loginData');
    if(!(logData && logData.role === 'stud')){
    return res.status(401).send("Invalid !")
     }else{
        console.log("Everything is working good")
      }
}
app.post('/verify-payment', async (req,res)=>{
    const {reference}=req.body
    console.log(reference)
     const verifyPayment=async()=>{
        return new Promise((resolve,reject)=>{
            paystack.transaction.verify(reference,(err,respond)=>{
                if(err){
                    reject("Error in payment verification...")
                }else{
                    resolve(respond.data)
                    console.log(respond.data);
                }
            })
        })
    }

 try{
    const logData=memory.get('loginData');
    const paymentResponse=await verifyPayment();
    if(!(paymentResponse.status === 'success')) return res.status(401).json({unsux:"Payment unsuccessful"}); 
    if(paymentResponse.status === 'success'){
        const now= new Date().toISOString();
        res.json({success:"Payment successful..."});
    }else{
        console.log("Payment response did not load...")
    }
     }
 catch(err){
    if(err){
        return res.status(404).json({ins:"Payment unsuccessful"})
    }
 }
 });

 app.post('/getpromotion',async(req,res)=>{
    const {email , term, seleClass}=req.body;
    console.log(email,term,seleClass);
    try {
        if(term === '3rd Term'){
            const classes=['primary 1','primary 2','primary 3','primary 4','primary 5','primary 6'];
            const okk=await pool.query('select grades from grades where email = $1 and term=$2 and studclass=$3',[email,term,seleClass]);
            console.log(okk.rows);
            okk.rows.map(grade=>{
                console.log('The grade',grade);
            });
            let resi=okk.rows.filter(gra=>{
                gra === 'A' 
            }).length + 2
                        console.log('The result length',resi);
                let resB=okk.rows.filter(gra=>{
                gra === 'B' 
            }).length 
            console.log('The result length',resB);
                let resC=okk.rows.filter(gra=>{
                gra === 'C' 
            }).length 
                console.log('The result length',resC);
                let resD=okk.rows.filter(gra=>{
                gra === 'D' 
            }).length
                console.log('The result length',resD); 
                let resE=okk.rows.filter(gra=>{
                gra === 'E' 
            }).length
                console.log('The result length',resE); 
            let resF=okk.rows.filter(gra=>{
                gra === 'F' 
            }).length 
                console.log('The result length',resF);
            const esmo=classes.indexOf(seleClass) + 1;
            console.log("3rd term new class ",classes[esmo]);
            if( resi>  resF){
                console.log("Working third term endpoint...");
                const esmo=classes.indexOf(seleClass) + 1;
               // await pool.query('insert into grades(studClass,email)  values($1,$2)',[classes[esmo],email]);
                await pool.query('update serl set studclass=$1 where email=$2',[classes[esmo],email]);
                console.log(`Student passed: Promoted to next class:${classes[esmo]}`);
                return res.json({Success:"Student Passed",news:`Promoted to the next class:${classes[esmo]}`});
            }else{
               return res.json({msg:'Student did not meet up to school demands'});
            }
        }
    } catch (error) {
        console.error("Error in catching data ",error);
    }
 })
app.post('/mark-data',async(req,res)=>{
    const {email}=req.body
    await pool.query('update serl set paidAt=NOW() where email=$1',[email]);
    res.json({marked:"Marked successfully"});
    console.log('Updated time successfully...')        
})

app.get('/check-access',async(req,res)=>{
    const logData=memory.get('loginData');
    console.log('this is check access email...',logData.email)
    const result = await pool.query(
  `SELECT paidAt FROM serl WHERE email = $1`,
  [logData.email]
);
console.log('check access the email is ...',logData.email);
if (result.rows[0].paidAt) {
  const paidAt = new Date(result.rows[0].paidAt);
  const now = new Date();
  const diffMs = now - paidAt;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  console.log("Respect yourself check access...");
  if (diffDays <= 7) {
    return res.json({suc:'Worked',redirect:"/stud.html"});
  }
}
res.json({ Notallowed: 'Did not work' });
});
 
app.get('/grades',async(req,res)=>{
    const {email,year,term} = req.query;
    
    let queree= {
        ins:`select * from grades where email=$1 and year=$2 and term=$3`,
        val:[email,year,term]
    }

    const {ins,val} = queree;
    let results = await pool.query(ins,val)
    let display= results.rows;

    if(display.length === 0){
        return res.status(404).send("Exercise Patience your results have not yet been uploaded")
    }else{
        console.log(display)
    }
    const ert={
        ertText:'select * from serl where email=$1',
        ertVal:[email]
    }
    let okay=await pool.query(ert.ertText,ert.ertVal);
    

const doc= new pdfDoc();
res.header('Content-type','application/pdf')
res.attachment(`grades_${email},${year},${okay.rows[0].firstname},${okay.rows[0].lastname}`)
doc.pipe(res);

        doc.fontSize(20).text(`Grades Report - ${term} ${year} ${okay.rows[0].firstname} ${okay.rows[0].lastname}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Term: ${term}`, { align: 'left' });
        doc.moveDown();

        doc.fontSize(14).text('Course | Grade', { bold: true });
        display.forEach((row) => {
            doc.text(`${row.subject} | ${row.grades}`);
        });
        doc.end();
 })

 app.get('/getTranscript',async(req,res)=>{
    const {email} = req.query;
    const results=await pool.query('select * from grades where email=$1',[email]);
    console.log(results);
    const display=results.rows
    console.log('Display...',display);
    const doc= new pdfDoc();
    res.header('Content-type','application/pdf')
    res.attachment(`transcript_${email}_${year}_${okay.results[0].firstname}_${okay.results[0].lastname}`)
    doc.pipe(res);

        doc.fontSize(20).text(`Grades Report - ${term} ${year}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Student ID: ${term}`, { align: 'left' });
        doc.moveDown();

        doc.fontSize(14).text('Course | Grade', { bold: true });
        display.forEach((row) => {
            doc.text(`${row.subject} | ${row.grades}`);
        });
        doc.end();
})
app.get('/displayTrans',async(req,res)=>{
    try {
        const {email} = req.query;
        console.log("Transcript email: ",email);
        const reso=await pool.query('select * from grades where email=$1',[email]);
        console.log(reso,'reso working...');
        res.json({reso:reso});
    } catch (error) {
        console.error("Error fetching transcript ",error)
    }
})
app.post('/logout',(req,res)=>{
req.session.destroy(err=>{
    if(err) throw err + console.log("Error in logging out")
        else{
    console.log("Everywhere good")
        }
})

res.clearCookie('connect.sid')

res.redirect('/Login.html')
})

async function RunAppL(){
    try{
        await table()
    }catch(err){
    console.error('Error ,Connect again' + err.stack)
    }
    }
    RunAppL().catch(err=> console.error('Could not load '))
    app.set('view engine','ejs');
    app.set('views',path.join(__dirname ,'views'))
 
 let port=3000
 app.listen(port).on('error',(err)=>{
    console.error('Error Over here' + err)
    process.exit(1)
 })
 


/*
const {Pool} = require('pg');
const express= require('express');
const path=require('path');
const app=express()
app.use(express.urlencoded({extended:true}));

const pool=new Pool({
    host:'localhost',
    database:'soma',
    password:'polo',
    port:5432,
    user:'please'
})

async function createTable() {
    try{
        await pool.connect()
        const table=`
        create table if not exists SchoolData(
        id serial primary key,
        First Name varchar(40) unique not null,
        Last Name varchar(40) unique not null,
        Age Integer unique not null,
        Email varchar(40) unique not null,
        created_at timestamp default current time_stamp
        )
        `
        await pool.query(table)
        console.log("Table was created successfully")
    }catch(err){
if(err){
    console.error('Error first' + ' ' + err.stack)
}
    }
}
app.get('/',(req,res)=>{
    res.sendFile(path.__dirname + '/schoolPortal.html')
})

app.post('/register',(req,res)=>{
    const {FirstName,LastName,age,email} = req.body;
    
})
async function Run() {
    try{
        await createTable()
    }catch(err){
console.log("Error loading")
    }
}

Run().catch(err=>console.error("Huge Error"))
*/
