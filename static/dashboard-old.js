// Function to apply the saved theme
function applySavedTheme() {
    const body = document.body;

    // Apply dark/light mode
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "true") {
        body.classList.add("dark");
    } else {
        body.classList.remove("dark");
    }

    // Apply theme color
    const savedThemeColor = localStorage.getItem("themeColor");
    if (savedThemeColor) {
        document.documentElement.style.setProperty("--primary-color", savedThemeColor);

        // Apply the saved theme color to header, sidebar, buttons, and table headers
        const header = document.querySelector("header");
        const sidebar = document.getElementById("sidebar");
        if (header) header.style.backgroundColor = savedThemeColor;
        if (sidebar) sidebar.style.backgroundColor = savedThemeColor;

        const buttons = document.querySelectorAll("button");
        const tableHeaders = document.querySelectorAll("table th");
        buttons.forEach((button) => {
            button.style.backgroundColor = savedThemeColor;
        });
        tableHeaders.forEach((header) => {
            header.style.backgroundColor = savedThemeColor;
        });
    }
}

// Function to handle file upload
function handleFileUpload() {
    const uploadForm = document.getElementById("upload-form");
    const zipFileInput = document.getElementById("zip-file");
    const excelFileInput = document.getElementById("excel-file");

    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Validate files
        const zipFile = zipFileInput.files[0];
        const excelFile = excelFileInput.files[0];

        if (!zipFile || !excelFile) {
            alert("Please upload both a ZIP file and an Excel file.");
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
                throw new Error("Failed to upload files");
            }

            const result = response;
            alert("Files uploaded successfully!");
            console.log(result);
        } catch (error) {
            console.error("Error uploading files:", error);
            alert("Error uploading files. Please try again.");
        }
    });
}

// Apply saved theme and initialize file upload handler
document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme();
    handleFileUpload();
});
