const plantImage = document.getElementById("plantImage");
const chooseButton = document.getElementById("chooseButton");
const uploadArea = document.getElementById("uploadArea");

const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");

const identifyButton = document.getElementById("identifyButton");
const loading = document.getElementById("loading");

const resultSection = document.getElementById("resultSection");
const plantName = document.getElementById("plantName");
const scientificName = document.getElementById("scientificName");
const confidence = document.getElementById("confidence");
const topResults = document.getElementById("topResults");

// Disease elements
const diseaseSection = document.getElementById("diseaseSection");
const diseaseName = document.getElementById("diseaseName");
const diseaseConfidence = document.getElementById("diseaseConfidence");
const diseaseInfo = document.getElementById("diseaseInfo");
const diseaseSymptoms = document.getElementById("diseaseSymptoms");
const diseasePrevention = document.getElementById("diseasePrevention");


// ------------------------------------
// Choose Image
// ------------------------------------

chooseButton.addEventListener("click", () => {
    plantImage.click();
});


// ------------------------------------
// Image Selected
// ------------------------------------

plantImage.addEventListener("change", () => {

    const file = plantImage.files[0];

    if (!file) {
        return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {

        alert("Please select a JPG, JPEG or PNG image.");

        plantImage.value = "";

        return;
    }

    const imageURL = URL.createObjectURL(file);

    previewImage.src = imageURL;

    previewContainer.hidden = false;

    resultSection.hidden = true;
    diseaseSection.hidden = true;
});


// ------------------------------------
// Identify Button
// ------------------------------------

identifyButton.addEventListener("click", identifyPlant);


// ------------------------------------
// Identify Plant + Disease
// ------------------------------------

async function identifyPlant() {

    const file = plantImage.files[0];

    if (!file) {

        alert("Please select an image first.");

        return;
    }

    loading.hidden = false;
    previewContainer.hidden = true;

    resultSection.hidden = true;
    diseaseSection.hidden = true;

    identifyButton.disabled = true;

    try {

        // =================================
        // STEP 1: PLANT IDENTIFICATION
        // =================================

        console.log("Sending image for plant identification...");

        const plantFormData = new FormData();

        plantFormData.append("image", file);

        const plantResponse = await fetch("/identify", {
            method: "POST",
            body: plantFormData
        });

        const plantData = await plantResponse.json();

        console.log("Plant response:", plantData);

        if (!plantResponse.ok) {

            throw new Error(
                plantData.error ||
                "Plant identification failed."
            );
        }

        // Display plant result
        displayResults(plantData);


        // =================================
        // STEP 2: DISEASE DETECTION
        // =================================

        console.log("Sending image for disease detection...");

        const diseaseFormData = new FormData();

        diseaseFormData.append("image", file);

        const diseaseResponse = await fetch("/disease", {
            method: "POST",
            body: diseaseFormData
        });

        const diseaseData = await diseaseResponse.json();

        console.log("Disease response:", diseaseData);

        if (!diseaseResponse.ok) {

            throw new Error(
                diseaseData.error ||
                "Disease detection failed."
            );
        }

        // Display disease result
        displayDiseaseResults(diseaseData);

    } catch (error) {

        console.error("Detection error:", error);

        alert(
            "Unable to process the image.\n\n" +
            error.message
        );

    } finally {

        loading.hidden = true;

        identifyButton.disabled = false;

        previewContainer.hidden = false;
    }
}


// ------------------------------------
// Display Plant Results
// ------------------------------------

function displayResults(data) {

    console.log("Pl@ntNet plant data:", data);

    resultSection.hidden = false;

    const results = data.results || [];

    if (results.length === 0) {

        plantName.textContent = "Plant Not Identified";

        scientificName.textContent =
            "No confident identification was found.";

        confidence.textContent = "0%";

        topResults.innerHTML =
            "<p>No identification results were returned.</p>";

        return;
    }

    const bestResult = results[0];

    const commonNames =
        bestResult.species?.commonNames || [];

    const scientific =
        bestResult.species?.scientificName ||
        "Unknown species";

    if (commonNames.length > 0) {

        plantName.textContent = commonNames[0];

    } else {

        plantName.textContent = scientific;
    }

    scientificName.textContent = scientific;

    const score =
        typeof bestResult.score === "number"
            ? bestResult.score
            : 0;

    confidence.textContent =
        `${(score * 100).toFixed(1)}%`;

    topResults.innerHTML = "";

    results.slice(0, 5).forEach((result, index) => {

        const species =
            result.species || {};

        const name =
            species.scientificName ||
            "Unknown";

        const names =
            species.commonNames || [];

        const resultScore =
            typeof result.score === "number"
                ? result.score * 100
                : 0;

        const resultElement =
            document.createElement("div");

        resultElement.className =
            "top-result";

        resultElement.innerHTML = `
            <div>
                <strong>
                    ${index + 1}. ${escapeHTML(name)}
                </strong>

                ${
                    names.length
                        ? `<small>${escapeHTML(names[0])}</small>`
                        : ""
                }
            </div>

            <strong>
                ${resultScore.toFixed(1)}%
            </strong>
        `;

        topResults.appendChild(resultElement);
    });
}


// ------------------------------------
// Display Disease Results
// ------------------------------------

function displayDiseaseResults(data) {

    console.log("Pl@ntNet disease data:", data);

    diseaseSection.hidden = false;

    const results = data.results || [];

    // No disease result
    if (results.length === 0) {

        diseaseName.textContent =
            "No Disease Identified";

        diseaseConfidence.textContent =
            "0%";

        diseaseInfo.textContent =
            "The disease detection service did not return a probable disease for this image.";

        diseaseSymptoms.textContent =
            "No symptoms were identified by the service.";

        diseasePrevention.textContent =
            "Use a clear image of the affected leaf and try again.";

        return;
    }


    // Best disease result
    const bestDisease = results[0];

    const name =
        bestDisease.description ||
        bestDisease.name ||
        "Unknown disease";

    const score =
        typeof bestDisease.score === "number"
            ? bestDisease.score
            : 0;


    // Disease name
    diseaseName.textContent = name;


    // Confidence
    diseaseConfidence.textContent =
        `${(score * 100).toFixed(1)}%`;


    // Information
    diseaseInfo.textContent =
        `Probable disease detected: ${name}.`;


    // Symptoms
    diseaseSymptoms.textContent =
        "Check the affected plant for symptoms matching this disease. The Pl@ntNet disease API provides the probable disease identification; it does not provide a complete treatment guide for every result.";


    // Prevention
    diseasePrevention.textContent =
        "Remove severely affected plant material where appropriate, keep plants healthy, and follow guidance from a qualified agricultural expert for treatment of the specific disease.";


    // Show other disease results
    if (results.length > 1) {

        const otherResults = document.createElement("div");

        otherResults.className = "info-box";

        otherResults.innerHTML = `
            <h3>🔎 Other Possible Diseases</h3>
        `;

        results.slice(1, 5).forEach((result, index) => {

            const resultName =
                result.description ||
                result.name ||
                "Unknown";

            const resultScore =
                typeof result.score === "number"
                    ? result.score * 100
                    : 0;

            const item =
                document.createElement("p");

            item.innerHTML = `
                ${index + 2}. 
                ${escapeHTML(resultName)}
                — ${resultScore.toFixed(1)}%
            `;

            otherResults.appendChild(item);
        });

        diseaseSection
            .querySelector(".result-card")
            .appendChild(otherResults);
    }
}


// ------------------------------------
// Prevent HTML Injection
// ------------------------------------

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}