// Function to apply the saved theme
function applySavedTheme() {
    const body = document.body;

    // Apply dark/light mode
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }

    // Apply theme color
    const savedThemeColor = localStorage.getItem('themeColor');
    if (savedThemeColor) {
        document.documentElement.style.setProperty('--primary-color', savedThemeColor);

        // Update relevant elements with the theme color
        const elementsToColor = [
            document.querySelector('header'),
            document.getElementById('sidebar'),
            ...document.querySelectorAll('button'),
            ...document.querySelectorAll('table th'),
        ];

        elementsToColor.forEach(element => {
            if (element) element.style.backgroundColor = savedThemeColor;
        });
    }
}

// function getNumbers(num) {
//     const n = Number(num).toFixed(2);
//     return n ? n : 0;
// }

// Function to add a new user
async function addUser(uid, name, matchScore) {
    try {
        const response = await fetch('/add_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid, name, matchScore })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add user');
        }

        return data;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
}

// Function to get users (optionally filtered by UID)
async function getUsers(uid = null) {
    try {
        const url = uid ? `/get_users?uid=${uid}` : '/get_users';
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch users');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}


// Function to render data in the table
function renderTableData(data) {
    const tableBody = document.querySelector('#matching-scores-table tbody');

    if (!tableBody) {
        console.error("Table body not found.");
        return;
    }

    // Clear existing rows
    tableBody.innerHTML = '';

    // Populate table rows with data
    data.forEach(item => {
        const row = document.createElement('tr');

        // Create and append Aadhaar Number cell
        const aadhaarCell = document.createElement('td');
        aadhaarCell.textContent = item.aadhaarNumber || 'N/A';
        row.appendChild(aadhaarCell);

        // Create and append Name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = item.name || 'N/A';
        row.appendChild(nameCell);

        // Create and append Match Score cell
        const scoreCell = document.createElement('td');
        scoreCell.textContent = item.matchScore ? `${item.matchScore}%` : 'N/A';
        row.appendChild(scoreCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    });
    document.getElementById('data-analytics').style.display = 'block';
    console.log(getUsers())
}

// Example response data
const responseData = [
    { aadhaarNumber: '1234 5678 9012', name: 'John Doe', matchScore: 95 },
    { aadhaarNumber: '9876 5432 1098', name: 'Jane Smith', matchScore: 85 },
    { aadhaarNumber: '4567 8901 2345', name: 'Alice Johnson', matchScore: 75 },
    { aadhaarNumber: '7890 1234 5678', name: 'Bob Brown', matchScore: 90 },
    { aadhaarNumber: '3210 9876 5432', name: 'Charlie Davis', matchScore: 80 },
];

function updateAnalytics(data) {
    const analyticsContainer = document.getElementById('analytics-section');

    if (!analyticsContainer) {
        console.error("Analytics container not found.");
        return;
    }

    // Clear existing analytics
    analyticsContainer.innerHTML = '';

    // Iterate through the data and create metrics
    for (const [key, value] of Object.entries(data)) {
        // Create a new metric div
        const metricDiv = document.createElement('div');
        metricDiv.className = 'metric';

        // Create label span
        const labelSpan = document.createElement('span');
        labelSpan.className = 'label';
        labelSpan.textContent = key; // key is a string

        // Create value span
        const valueSpan = document.createElement('span');
        valueSpan.style.marginLeft = "5px"
        valueSpan.className = 'value';
        valueSpan.textContent = String(value); // Convert value to string

        // Append label and value spans to the metric div
        metricDiv.appendChild(labelSpan);
        metricDiv.appendChild(valueSpan);

        // Append the metric div to the analytics container
        analyticsContainer.appendChild(metricDiv);
    }
}

// Example data
const analyticsData = {
    '% Match': '85%',
    '% Unmatched': '15%',
    'Aadhaar Data': 200, // Numeric values
    'Non-Aadhaar Data': 50,
    'Total Records': 250
};

// Function to handle file upload
function handleFileUpload() {
    const uploadForm = document.getElementById("upload-form");
    const zipFileInput = document.getElementById("zip-file");
    const excelFileInput = document.getElementById("excel-file");

    if (!uploadForm || !zipFileInput || !excelFileInput) {
        console.error("Upload form or inputs are missing in the DOM.");
        return;
    }

    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Validate files
        const zipFile = zipFileInput.files[0];
        const excelFile = excelFileInput.files[0];

        if (!zipFile || !excelFile) {
            alert("Please upload both a ZIP file and an Excel file.");
            return;
        }

        // Validate file types
        if (zipFile.type !== "application/zip") {
            alert("Invalid ZIP file. Please upload a valid .zip file.");
            return;
        }
        if (!["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(excelFile.type)) {
            alert("Invalid Excel file. Please upload a valid .xlsx or .xls file.");
            return;
        }

        // Create FormData and append files
        const formData = new FormData();
        formData.append("zip_file", zipFile);
        formData.append("excel_file", excelFile);

        try {
            // Send files to the server
            const response = await fetch("/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            renderTableData(responseData);
            updateAnalytics(analyticsData);
            // const result = await response.json();
            // alert("Files uploaded successfully!");
            console.log("Upload response:", response);
        } catch (error) {
            console.error("Error uploading files:", error);
            alert("Error uploading files. Please try again.");
        }
    });
}

// Apply the saved theme and handle other initialization tasks
document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme();
    handleFileUpload();
    responseData.forEach(item => {
        addUser(item.aadhaarNumber, item.name, item.matchScore)
    })

    // Sidebar Toggle
    const sidebar = document.getElementById("sidebar");
    const openSidebarBtn = document.getElementById("open-sidebar");
    const closeSidebarBtn = document.getElementById("close-sidebar");
    const dashboardContainer = document.querySelector(".dashboard-container");

    if (openSidebarBtn && closeSidebarBtn) {
        openSidebarBtn.addEventListener("click", () => {
            if (sidebar) sidebar.classList.add("open");
            if (dashboardContainer) dashboardContainer.classList.add("shift");
        });

        closeSidebarBtn.addEventListener("click", () => {
            if (sidebar) sidebar.classList.remove("open");
            if (dashboardContainer) dashboardContainer.classList.remove("shift");
        });
    }

    // Theme Toggle (Dark/Light Mode)
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const isDarkMode = body.classList.toggle("dark");
            themeToggle.innerHTML = isDarkMode
                ? '<i class="fas fa-sun"></i> Light Mode'
                : '<i class="fas fa-moon"></i> Dark Mode';

            localStorage.setItem("darkMode", isDarkMode);
        });

        const savedDarkMode = localStorage.getItem("darkMode") === "true";
        body.classList.toggle("dark", savedDarkMode);
        themeToggle.innerHTML = savedDarkMode
            ? '<i class="fas fa-sun"></i> Light Mode'
            : '<i class="fas fa-moon"></i> Dark Mode';
    }

    // Theme Customization (Color Picker)
    const themeColorInput = document.getElementById("theme-color");
    const applyThemeButton = document.getElementById("apply-theme");

    if (applyThemeButton && themeColorInput) {
        applyThemeButton.addEventListener("click", () => {
            const color = themeColorInput.value;
            document.documentElement.style.setProperty("--primary-color", color);

            const elementsToColor = [
                document.querySelector("header"),
                document.getElementById("sidebar"),
                ...document.querySelectorAll("button"),
                ...document.querySelectorAll("table th"),
            ];

            elementsToColor.forEach(element => {
                if (element) element.style.backgroundColor = color;
            });

            localStorage.setItem("themeColor", color);
        });

        const savedThemeColor = localStorage.getItem("themeColor");
        if (savedThemeColor) {
            themeColorInput.value = savedThemeColor;
        }
    }

    // Search Functionality
    const searchInput = document.getElementById("search-input");
    const tableBody = document.querySelector("#matching-scores-table tbody");

    if (searchInput && tableBody) {
        searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = tableBody.querySelectorAll("tr");

            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                const match = Array.from(cells).some(cell =>
                    cell.textContent.toLowerCase().includes(searchTerm)
                );
                row.style.display = match ? "" : "none";
            });
        });
    }
});
