let subzero;
let fname=document.getElementById('fname');
let lname=document.getElementById('lname');
let disName;
let form=document.getElementById('form');
let few=document.getElementById("grade");
let studentName=document.getElementById('student_name')
let seleClass=document.getElementById('seleClass')
const btnb=document.getElementById('btnb');
let ihe;
let endPoint;
    const getIt=async(e)=>{
        switch(seleClass.value){
    case 'primary 1':
        endPoint='/getData?selectedClass=primary 1'
        console.log("Pri 1 selected.");
        seleClass.value='';
        break
        case 'primary 2':
            endPoint='/getData?selectedClass=primary 2';
            console.log("Pri 2 selected.");
            seleClass.value='';
            break
            case 'primary 3':
                endPoint='/getData?selectedClass=primary 3';
                console.log("Pri 3 selected.");
                seleClass.value='';
                break
                case 'primary 4':
                    endPoint='/getData?selectedClass=primary 4';
                    console.log('Pri 4 selected');
                    seleClass.value='';
                    break
                    case 'primary 5':
                        endPoint='/getData?selectedClass=primary 5';
                        console.log('Pri 5 selected');
                        seleClass.value='';
                        break
                        case 'primary 6':
                            endPoint='/getData?selectedClass=primary 6';
                            console.log('Pri 6 selected');
                            seleClass.value='';
}
        e.preventDefault();
        console.log('This is selected class ',seleClass || 'No selected Class.')
try {
        const data=await fetch(endPoint,{
        method:'GET',
        headers:{
            'Content-Type':'application/json'
        }
    });
    if(!data.ok){
        return document.getElementById('cont').textContent='Error fetching students data.';
    }else{
      document.getElementById('cont').textContent='Student info successfully fetched,Proceed with selecting names.';  
      setTimeout(()=>{
        document.getElementById('cont').textContent=' '
      },3000);
    let res=await data.json();
    console.log(res)
    const getData=res.data;
    if(getData.length === 0){
        return document.getElementById('cont').textContent='No data for any student of this class.';
    }  
    console.log('Data from GetData ',getData);
    let getDatas=[];
    getDatas=getData;
    getData.forEach(element => {
        const option=document.createElement('option');
        disName=`${element.firstname} ${element.lastname}`
        option.textContent=disName;
        option.value=`${element.email}`;
        studentName.appendChild(option);
        console.log(option.value);

    });
    }
} catch (error) {
console.log("Error in getting data from server ",error)    
}
}
btnb.addEventListener('click',getIt);
let selectedEmail;
studentName.addEventListener('change', (e) => {
selectedEmail = e.target.value;
console.log("Selected student's email:", selectedEmail);
});

async function loadLoginData() {
try {
const response = await fetch('/loginTeacher');
if (!response.ok) {
  console.log("Error in fetching loginData");
  return;
}
const data = await response.json();
console.log("Login data:", data);

fname.textContent = `${data.firstName}`;
lname.textContent = data.lastName;
subzero = data.subject; 
document.getElementById('subInfo').textContent=data.subject;
const wel=document.getElementById('welc').textContent;
if(!speechSynthesis){
return alert("Will not work");
}
let utterance;
utterance= new SpeechSynthesisUtterance(wel);
utterance.rate=0.8;
utterance.pitch=0.6;
utterance.volume=5;
window.speechSynthesis.speak(utterance);
} catch (error) {
console.error("Error in loginData", error);
}
console.log("Subject:", subzero);
}

loadLoginData();

form.addEventListener('submit',async(e)=>{
let grade=document.getElementById('grade').value.trim();
let year=document.getElementById('year').value;
let term=document.getElementById('Term').value;
const seleClass=document.getElementById('seleClass').value;
 console.log("Submit data...",disName,grade,subzero,year,term,seleClass);
    e.preventDefault();
    if(!(disName || grade || subject || email || term || year || seleClass)){
        console.error("Values not complete");
        return document.getElementById('info').textContent='Input all data before submission.'
    }
    try {
        const data=await fetch('/submitGrade',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            studentName:disName,
            grade:grade,
            subject:subzero,
            email:selectedEmail,
            term:term,
            year:year,
            seleClass:seleClass
        })
    });
    if(!data.ok){
        return console.error('Error in submitting grade.');
    }
    const dataRes=await data.json();
    console.log(dataRes.ErrMsg);
    if(dataRes){
        //console.log(dataRes.successful);
        if(dataRes.successful){
        document.getElementById("info").textContent=`${disName} ${dataRes.successful}`;
        setTimeout(()=>{
            document.getElementById("info").textContent=''
        },3000)
        }else{
            console.log(`${dataRes.ErrMsg} is logged...`)
            document.getElementById("info").textContent=dataRes.ErrMsg;
            setTimeout(()=>{
            document.getElementById("info").textContent=''
        },3000)
        }
    }
    if(term === '3rd Term'){
        const fer=await fetch('/getPromotion',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            email:selectedEmail,
            seleClass:seleClass,
            term:term
        })
    });
    if(!fer.ok){
        console.error("Error in fetching getPromotion Data...");
    }
    const irr=fer.json();
    console.log("Promotion Data ",irr);
    if(irr.Success && irr.news){
        localStorage.setItem('successMsg',irr.Success);
        localStorage.setItem('goodNews',irr.news);
    }
    if(irr.msg){
        localStorage.setItem('badMsg',irr.msg);
    }
    }
    } catch (error) {
        console.error("Error in submission of data ",error)
    }
});

const yearSel=document.getElementById('year');
const currentYear=new Date().getFullYear();
console.log(currentYear-1,currentYear-2,currentYear-3);
let years=[currentYear-1,currentYear-2,currentYear];
years.forEach(year=>{
    let option=document.createElement('option');
    option.value=year;
    option.textContent=year;
    yearSel.appendChild(option);
});
const olo=()=>{
    const classes=['primary 1','primary 2','primary 3','primary 4','primary 5','primary 6'];
    let ik=classes.indexOf('primary 1') + 1;
    console.log(classes[ik]);
    console.log(ik)
}
olo();