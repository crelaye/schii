        const fname=document.getElementById('fname');
        const lname=document.getElementById('lname');
        const form=document.getElementById('form');
        const reference = 'payment_verification_' + Math.random().toString(36).substr(2, 9).replace(/[^a-zA-Z0-9]/g, '');
        const amount = 1500;
        form.addEventListener('submit',async(e)=>{
            e.preventDefault();
            try {
                // ASYNC FUNCTION FOR RESPONSE AFTER SUCCESSFUL PAYMENT...
                const itsTime=async()=>{
                const email=document.getElementById('email').value;
                const year=document.getElementById('year').value;
                const term=document.getElementById('term').value;
                    const response=await fetch('/student',{
                    method:'POST',
                    headers:{
                        'Content-Type':'application/json'
                    },
                    body:JSON.stringify({
                        email:email,
                        year:year,
                        term:term
                    })
                })
                const dataRes=await response.json();
                if(dataRes.remy.length === 0 || dataRes.remy.length === undefined){
                    document.getElementById('inf').textContent='No data for the selected inputs,check selected data and try again.Thank You.';   
                    setTimeout(()=>{
                        document.getElementById('inf').textContent=''
                    },5000);
                }
                let ope=document.getElementById("open");
                console.log(dataRes);
//              window.location.href='./studentPayment.html'
                let tsub=document.getElementById('tsub');
                let tgrades=document.getElementById('tgrades');
                let tname=document.getElementById('tname');
                let tyear=document.getElementById('tyear');
                let tterm=document.getElementById('tterm');
                //tname.textContent=dataRes.remy[0].email;

                //SUBJECT DATA...
                dataRes.remy.forEach(sub=>{
                    const dataR=document.createElement('tr');
                    const dataT=document.createElement('td');
                    dataT.textContent=sub.subject;
                    dataR.appendChild(dataT);

                    // YEAR DATA...
                    const dataGR=document.createElement('td');
                    dataGR.textContent=sub.grades;
                    dataGR.id='ste';
                    dataR.appendChild(dataGR);

                    //TERM DATA...
                    const dataTR=document.createElement('td');
                    dataTR.textContent=sub.year
                    dataR.appendChild(dataTR);

                    // GRADE DATA...
                    const datagT=document.createElement('td');
                    //datagT.id='ste'
                    datagT.textContent=`${" 2nd Semester"}`;
                    dataR.appendChild(datagT);

                    //CLASS DATA...
                    const datacT=document.createElement("td");
                    datacT.textContent=sub.studclass;
                    dataR.appendChild(datacT);
                    ope.appendChild(dataR);
                    //tsub.appendChild(itt);
                    //ope.appendChild(tsub);
                });

                const pdfRes=await fetch(`/grades?email=${email}&year=${year}&term=${term}`);
                if(!pdfRes.ok)return console.error('Error downloading grades from server.');
                const blob=await pdfRes.blob();
                const url= window.URL.createObjectURL(blob);
                const a=document.createElement('a');
                a.href=url;
                a.download=`grades_${email}_${year}_${term}.pdf`;
                a.click();
                a.remove();
                console.log("Worked till here...",a);
                window.URL.revokeObjectURL;
                };
                itsTime();

                
                // ASYNC FUNCTION FOR SENDING DATA TO SERVER FOR PAYMENT...
                /**
                 * const data=async()=>{
                const email=document.getElementById('email').value;
                const year=document.getElementById('year').value;
                const term=document.getElementById('term').value;
                localStorage.setItem('email',email);
                localStorage.setItem('year',year);
                localStorage.setItem('term',term);
                
    const handler = PaystackPop.setup({
      key: 'pk_test_9ba3a415c4b1c7fdf53881fde1abaff29082117a',
      email: email,
      amount: amount,
      currency: 'NGN',
      ref: reference,
      callback: function (response) {
        console.log(reference);
        fetch('/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reference })
        })
        .then(res => {
          if (!res.ok) {
            console.log("Response not available...for payment...");
          }
          return res.json();
        }).then(response=>{
            console.log(response);
            if(response.success){
                itsTime();
            }else{
                console.error("Error in payment");
            }
        })
          .catch(err => {
          console.log("Error in payment frontend ", err);
        });
      },
      onClose: function () {
        console.log('Transaction cancelled or closed');
      }
    });
    handler.openIframe();
                 }
             data()
                 */
            } catch (error) {
             console.log("Error in submission and pdf download...",error)   
            }
        })

        fetch('/loginStudent').then(response=>{
            if(!response.ok){
                return console.error("Error in retrieving student details...");
            }
            console.log(response);
            return response.json();
        }).then(data=>{
            console.log(data);
            fname.textContent=`${data.firstName}`;
            lname.textContent=data.lastName;
            let dike=document.getElementById("welc").textContent;
            let speech;
            if(!speechSynthesis){
                alert("It won't work");
            }else{
                alert("It will work");
            }
            speech=new SpeechSynthesisUtterance(dike);
            speech.pitch=0.8;
            speech.rate=0.8;
            speech.volume=9;
            window.speechSynthesis.speak(speech);
        });
        console.log(new Date().getFullYear())
        const currentYear=new Date().getFullYear();
    console.log();
    const year=document.getElementById('year');
    const years=[currentYear-3,currentYear-2,currentYear-1,currentYear];
    years.forEach(yr=>{
        const option=document.createElement("option");
        option.textContent=yr;
        option.value=yr;
        year.appendChild(option); 
    });
    const no=new Date() ;
    console.log(no)