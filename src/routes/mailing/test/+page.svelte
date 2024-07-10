<script lang="ts">

async function sendCallsheetNotification() {
	console.log('Send Callsheet Notification');
	let contact = {
            id : 1,
			first_name: 'Judith',
			last_name: 'Lecoq',
			email: 'lecoqjudith@gmail.com',
	};

	let project = {
			id: 1, 
			name: 'Test'
		};

	let callsheet =  {
			id: 1,
			version: '1.0',
			project_id: 1
		};

    let to_contact: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      messenger: string;
    }

	to_contact = {
			first_name: 'Prénom',
			last_name: 'Nom',
			email: 'adresse@contact.com',
			phone: '01 23 45 67 89',
			messenger: 'messenger'
	};

	const data = {
    contact: contact,
    project: project,
    callsheet: callsheet,
    to_contact: to_contact,
  	};


  	try {
    	const resMail = await fetch('/api/mailing/sendCallsheetNotifications', {
      	method: 'POST',
     	headers: {
        	'Content-Type': 'application/json',
      	},
      	body: JSON.stringify(data),
    });
	}
	catch (error) {
		console.error('Error sending email:', error);
	}
	
}

async function sendRegistrationNotification() {
    console.log('Send Registration (confirmation) Notification');
    let contact = {
            id : 1,
            first_name: 'Judith',
            last_name: 'Lecoq',
            email: 'lecoqjudith@gmail.com'
    }

    let project = {
            id: 1, 
            name: 'Test'
    };

    let callsheet =  {
            id: 1,
            version: '1.0',
            project_id: 1
    };

    let to_contact = {
            first_name: 'Prénom',
            last_name: 'Nom',
            email: 'contact@mail.com',
            phone: '01 23 45 67 89',
            messenger: 'messenger'
        };

    const data = {
        contact: contact,
        project: project,
        callsheet: callsheet,
        to_contact: to_contact,
    };

    try {
        const resMail = await fetch('/api/mailing/sendRegistrationNotifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    }
    catch (error) {
        console.error('Error sending email:', error);
    }

}

async function sendRecommendationNotification() {
    console.log('Send Recommendation Notification');
    let contact = {
			first_name: 'Judith',
			last_name: 'Lecoq',
			email: 'lecoqjudith@gmail.com',
	};

    let project = {
            id: 1, 
            name: 'Test'
        };

    let registration =  {
            id: 1,
            version: '1.0',
            project_id: 1
        };

    const data = {
        contact: contact,
        project: project,
        registration: registration,
    };

    try {
        const resMail = await fetch('/api/mailing/sendRecommendationNotifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    }
    catch (error) {
        console.error('Error sending email:', error);
    }
}
</script>

<html lang="">
    <button class="
        bg-blue-500
        hover:bg-blue-700
        text-white
        font-bold
        py-2
        px-4
        rounded
    " on:click={sendCallsheetNotification}>Send Callsheet Notification</button>

    <button class="
        bg-yellow-500
        hover:bg-yellow-700
        text-white
        font-bold
        py-2
        px-4
        rounded" on:click={sendRegistrationNotification}>Send Confirmation Notification</button>

    <button class="
        bg-red-500
        hover:bg-red-700
        text-white
        font-bold
        py-2
        px-4
        rounded"
        on:click={sendRecommendationNotification}>Send Recommendation Notification</button>
</html>