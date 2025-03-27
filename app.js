let amount = document.getElementById("amount");
let category = document.getElementById("category");
let date = document.getElementById("date");
let displayAmount = document.getElementsByClassName("amount");
let displayCategory = document.getElementsByClassName("category");
let displayDate = document.getElementsByClassName("date");
let tbody = document.getElementById('tbody');
let total = document.querySelector(".bottom h1");
let price=0;
let addBtn = document.querySelector("#add");

// local storage functions

function saveExpensesToLocalStorage(expenses) {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

function getExpensesFromLocalStorage() {
    let expenses = localStorage.getItem("expenses");
    return expenses ? JSON.parse(expenses) : []; // Convert back to array
}


function addExpense(newExpense) {
    let expenses = getExpensesFromLocalStorage(); // Get existing expenses
    expenses.push(newExpense); // Add new expense
    saveExpensesToLocalStorage(expenses);// Update localStorage
    location.reload();
}

function deleteExpense(id) {
    let expenses = getExpensesFromLocalStorage();
    let updatedExpenses = expenses.filter(exp => exp.id !== id);
    saveExpensesToLocalStorage(updatedExpenses);
    location.reload();
}





// first load
function firstload(){
    let List = getExpensesFromLocalStorage();
    
        for (const element of List) {
            let tr = document.createElement("tr");
            let tdAmount = document.createElement("td");
            let tdCategory = document.createElement("td");
            let tdDate = document.createElement("td");
            let tdButton = document.createElement("button");
            
            tdAmount.textContent = element.amount;
            price += parseFloat(element.amount);
            tdAmount.classList="amount"
            tdCategory.textContent = element.category;
            tdCategory.classList="category"
            tdDate.textContent = element.date;
            tdButton.textContent = "remove";
            tdButton.style.textAlign = "left";
            // tdButton.setAttribute("id", element.id);
            tdButton.addEventListener("click", () => {
                deleteExpense(element.id);
            })

            tr.appendChild(tdAmount);
            tr.appendChild(tdCategory);
            tr.appendChild(tdDate);
            tr.appendChild(tdButton);


            tbody.appendChild(tr);
    }
    total.textContent = price + "₹"; 
}
firstload();

// handling events  

addBtn.addEventListener("click", () => {
    // Validate inputs
    if (isNaN(parseFloat(amount.value)) || date.length == 0) {
        alert("Please enter all details correctly");
        return;
    }

    // Store values in an object
    let expense = {
        id: Date.now(),
        amount: parseFloat(amount.value), // Convert to number
        category: category.value,
        date: date.value
    };

    try {
        addExpense(expense);
        amount.value = "";
        date.value = "";
    }
    catch (e) {
        console.log(e);
    }


})
