function showError(errorElement, title, desc) {
	const titleElem = errorElement.getElementsByClassName("upload-error-title")[0];
	const descElem = errorElement.getElementsByClassName("upload-error-desc")[0];

	titleElem.innerText = title;
	descElem.innerText = desc;
	errorElement.classList.remove("hidden");
}

function resetError(errorElement) {
	const titleElem = errorElement.getElementsByClassName("upload-error-title")[0];
	const descElem = errorElement.getElementsByClassName("upload-error-desc")[0];
	titleElem.innerText = descElem.innerText = "";
	errorElement.classList.add("hidden");
}

function strcmp(bytes, str)
{
	for (let i = 0; i < str.length; ++i)
		if (bytes[i] !== str.charCodeAt(i))
			return false;
	return true;
}

async function ctrValidate(file, filename) {
	if (!file.name.startsWith(filename) || file.size !== 4153344)
		return false;
	
	let ab = await file.arrayBuffer();
	let magic = new Uint8Array(ab).slice(0, 4);
	return strcmp(magic, "SAVE");
}

async function wupValidate(file) {
	if (file.size < 0x104 || file.size > 10485760) return false;
	let buf = new Uint8Array(await file.arrayBuffer());
	let slotTable = buf.slice(0x4, 0x104);
	let minSize = 0x104;
	for (let i = 255; i >= 0; i--) {
		if ((slotTable[i] & 0x80) == 0x80) {
			minSize += (i + 1) * 0x1000;
			break;
		}
	}
	return file.size >= minSize;
}

async function validateMultiple(files, cb) {
	for (let file of files) {
		if (!(await cb(file)))
			return false;
	}
	return true;
}

const ctrValidateA = (file) => ctrValidate(file, "partitionA");
const ctrValidateB = (file) => ctrValidate(file, "partitionB");

function createUploadArea(targetUrl, fileType, fileTypeInternal, supportsMultiple, fileValidator, errorElement) {
	const targetElement = document.createElement("div");
	targetElement.classList.add("upload-area");
	targetElement.id = `upload-area-${fileTypeInternal}`;
	
	const uploadInput = document.createElement("div");
	uploadInput.classList.add("upload-input");

	const uploadHint = document.createElement("label");
	uploadHint.classList.add("upload-hint", "bold");
	uploadHint.htmlFor = `upload-filesel-${fileTypeInternal}`;
	uploadHint.innerText = `Click here to upload ${fileType}`;

	const uploadFileSel = document.createElement("input");
	uploadFileSel.type = "file";
	uploadFileSel.id = `upload-filesel-${fileTypeInternal}`;
	uploadFileSel.classList.add("hidden");
	uploadFileSel.multiple = supportsMultiple;

	const uploadStatus = document.createElement("span");
	uploadStatus.classList.add("upload-status");
	uploadStatus.id = `upload-status-${fileTypeInternal}`;
	
	uploadFileSel.addEventListener("input", (e) => {
		resetError(errorElement);
		uploadStatus.classList.remove("green", "yellow");
		uploadStatus.innerText = '';
		if (supportsMultiple) {
			validateMultiple(e.target.files, fileValidator)
				.then(async (isValid) => {
					if (!isValid)
						return showError(errorElement, "Invalid dump file(s)", "One or more of the files you have chosen are invalid.");
					uploadFileSel.disabled = true;

					try {
						let uploaded = 0, failed = 0, exist = 0;
						let toUpload = e.target.files.length;

						uploadHint.innerText = `Uploading files (${uploaded}/${toUpload}) ...`;

						for (let file of e.target.files) {
							const resp = await fetch(targetUrl, { body: file, method: "POST" });
							switch (resp.status) {
								case 200:
									const ret = await resp.json();
									switch (ret["upload_result"]) {
										case 1:
											exist++;
										case 0:
											uploaded++;
											uploadHint.innerText = `Uploading files (${uploaded}/${toUpload}) ...`;
											break;
									}
									break;
								case 400:
									failed++;
									break;
							};
						}

						if (failed !== 0) {
							showError(errorElement, "Failed uploading files(s)", `${failed} file(s) failed uploading.`);
							if (uploaded !== 0) uploadStatus.classList.add("green");

							if (exist === 0)
								uploadStatus.innerText = `Succeeded: ${uploaded} file(s) (of which ${exist} already exist on the server), failed: ${failed} file(s).`;
							else
								uploadStatus.innerText = `Succeeded: ${uploaded} file(s), failed: ${failed} file(s).`;
						} else {
							uploadStatus.classList.add("green");
							if (exist === 0)
								uploadStatus.innerText = "Successfully uploaded all files, thank you!";
							else
								uploadStatus.innerText = `Successfully uploaded all files (${exist} of which already exist on the server). Thank you!`;
						}
					} catch (err) {
						console.log(err);
						showError(errorElement, "Failed uploading file(s)", "An error occurred when communicating with the server.");
					}

					uploadHint.innerText = `Click here to upload ${fileType}`;
					uploadFileSel.disabled = false;
				});
			return;
		}

		const file = e.target.files[0];

		fileValidator(file)
			.then(async (isValid) => {
				if (!isValid)
					return showError(errorElement, "Invalid dump file", "The chosen file is invalid.");

				uploadFileSel.disabled = true;
				uploadHint.innerText = `Uploading ${fileType}...`;
				try {
					const resp = await fetch(targetUrl, { body: file, method: "POST" })
					let body = null;
					switch (resp.status) {
						case 400: {
							body = await resp.text();
							showError(errorElement, "Failed uploading file", `Server response: ${body}`);
							} break;
						case 200: {
							body = await resp.json();

							switch (body["upload_result"]) {
								case 0:
									uploadStatus.innerText = `${fileType} uploaded successfully. Thank you!`;
									break;
								case 1:
									uploadStatus.innerText = "File already exists on server.";
									break;
							}

							uploadStatus.classList.add("green");
							} break;
						default: {
							showError(errorElement, "Failed uploading file", `Server status code: ${resp.status}`);
							uploadFileSel.value = "";
							} break;
					}
				} catch {
					showError(errorElement, "Failed uploading file", "An error occurred when communicating with the server.");
				}
				
				uploadFileSel.disabled = false;
				uploadHint.innerText = `Click here to upload ${fileType}`;
			})
	});

	uploadInput.append(uploadHint, uploadFileSel, uploadStatus);
	targetElement.append(uploadInput);

	return targetElement;
}

const apiUrl = 'https://bossarchive.raregamingdump.ca/api';

// ctr 

const ctrUploadAreaRoot = document.getElementById("ctr-upload-areas");
const ctrUploadSelector = document.getElementById("ctr-upload-filesel");
const ctrUploadWarn = document.getElementById("ctr-filesel-warn");
const ctrErrorBtn = document.getElementById("ctr-upload-error-btn");
const ctrError = document.getElementById("ctr-upload-error");

ctrErrorBtn.addEventListener("click", () => resetError(ctrError));

ctrUploadSelector.selectedIndex = 0;
let prevIndex = 0;

ctrUploadSelector.addEventListener("change", () => {
	ctrError.classList.add("hidden");
	if (prevIndex != ctrUploadSelector.selectedIndex)
		ctrUploadAreaRoot.innerHTML = "";

	switch (ctrUploadSelector.selectedIndex) {
		case 0:
			ctrUploadWarn.classList.add("hidden");
			break;
		case 1: {
				ctrUploadWarn.classList.add("hidden");
				ctrUploadAreaRoot.append(createUploadArea(`${apiUrl}/upload/ctr/partition-a`, "partitionA.bin", "part-a", false, ctrValidateA, ctrError));
			} break;
		case 2: {
				ctrUploadWarn.classList.remove("hidden");
				const ua = createUploadArea(`${apiUrl}/upload/ctr/partition-a`, "partitionA.bin", "part-a", false, ctrValidateA, ctrError);
				const ub = createUploadArea(`${apiUrl}/upload/ctr/partition-b`, "partitionB.bin", "part-b", false, ctrValidateB, ctrError);
				ctrUploadAreaRoot.append(ua, ub);
			} break;
	}
	prevIndex = ctrUploadSelector.selectedIndex;
});

// wup

const wupUploadAreaRoot = document.getElementById("wup-upload-areas");
const wupErrorBtn = document.getElementById("wup-upload-error-btn");
const wupError = document.getElementById("wup-upload-error");

wupErrorBtn.addEventListener("click", () => resetError(wupError));

wupUploadAreaRoot.append(createUploadArea(`${apiUrl}/upload/wup`, "task.db file(s)", "taskdb", true, wupValidate, wupError));
