const apiUrl = "https://bossarchive.raregamingdump.ca/api";
const statsRoot = document.getElementById("stats");
const statCtr = document.getElementById("stat-ctr");
const statWup = document.getElementById("stat-wup");

const queryStat = async (console) => {
	const resp = await fetch(`${apiUrl}/stats/${console}`);
	return resp.status === 200 ? parseInt(await resp.text()) : null;
}

async function loadStats() {
	const ctrCount = await queryStat("ctr");
	const wupCount = await queryStat("wup");
	return [ ctrCount, wupCount ];
}

loadStats()
	.then(ret => {
		if (ret.includes(null)) return;

		statCtr.innerText = ret[0];
		statWup.innerText = ret[1];
		statsRoot.classList.remove("hidden");
	});
