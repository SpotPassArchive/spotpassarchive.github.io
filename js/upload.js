/*
<div class="upload-area" id="upload-area-part-a">
	<div class="upload-input">
		<p class="upload-hint">Select partitionA.bin:</p>
		<input autocomplete="off" class="upload-file" type="file" id="upload-filesel-part-a">
	</div>
	<button class="upload-btn" id="upload-submit-part-a">Upload</button>
</div>
*/

function handleUpload(fileTypeInternal, targetUrl) {
	// TODO
	console.log(`called upload for ${fileTypeInternal}`);
}

function createUploadArea(targetUrl, fileType, fileTypeInternal) {
	const targetElement = document.createElement("div");
	targetElement.classList.add("upload-area");
	targetElement.id = `upload-area-${fileTypeInternal}`;
	
	const uploadInput = document.createElement("div");
	uploadInput.classList.add("upload-input");

	const uploadHint = document.createElement("p");
	uploadHint.classList.add("upload-hint");
	uploadHint.innerText = `Select ${fileType}:`;

	const uploadFileSel = document.createElement("input");
	uploadFileSel.type = "file";
	uploadFileSel.id = `upload-filesel-${fileTypeInternal}`;

	const uploadSubmitBtn = document.createElement("button");
	uploadSubmitBtn.id = `upload-submit-${fileTypeInternal}`;
	uploadSubmitBtn.innerText = "Upload";
	uploadSubmitBtn.classList.add("upload-btn");

	uploadSubmitBtn.addEventListener('click', () => handleUpload(fileTypeInternal, targetUrl));

	uploadInput.append(uploadHint, uploadFileSel);
	targetElement.append(uploadInput, uploadSubmitBtn);

	console.log(targetElement);
	return targetElement;
}

const ctrUploadAreaRoot = document.getElementById("ctr-upload-areas");
const ctrUploadSelector = document.getElementById("ctr-upload-filesel");
ctrUploadSelector.selectedIndex = 0;
let prevIndex = 0;

ctrUploadSelector.addEventListener("change", () => {
	if (prevIndex != ctrUploadSelector.selectedIndex)
		ctrUploadAreaRoot.innerHTML = "";

	// TODO: update urls and remove "test"
	switch (ctrUploadSelector.selectedIndex) {
	case 1:
			ctrUploadAreaRoot.append(createUploadArea("test", "partitionA.bin", "part-a"));
			break;
	case 2:
			[ ua, ub ] = [ createUploadArea("test", "partitionA.bin", "part-a"), createUploadArea("test", "partitionB.bin", "part-b") ]
			ctrUploadAreaRoot.append(...[ua, ub]);
			break;
	}
	prevIndex = ctrUploadSelector.selectedIndex;
});
