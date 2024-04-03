document.addEventListener('DOMContentLoaded', function() {
    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch('https://crystaladhesivesltd.com/confirmation');
        const data = await response.json();
        populateTable(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateTable(data) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.TransactionType}</td>
            <td>${item.Transaction_ID}</td>
            <td>${item.Amount}</td>
            <td>${item.Business_ShortCode}</td>
            <td>${item.BillRef_Number}</td>
            <td>${item.Invoice_Number}</td>
            <td>${item.OrgAccount_Balance}</td>
            <td>${item.ThirdParty_TransactionId}</td>
            <td>${item.PhoneNumber}</td>
            <td>${item.First_Name}</td>
            <td>${item.Middle_Name}</td>
            <td>${item.Last_Name}</td>
            <!-- Add more table data cells as needed -->
        `;
        tableBody.appendChild(row);
    });
}
