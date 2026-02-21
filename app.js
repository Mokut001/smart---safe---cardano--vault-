let lucid;
let userAddr = '';
let vaultData = {
    target: 0,
    current: 0,
    active: false
};

const connectBtn = document.getElementById('connectBtn');
const setupView = document.getElementById('setupView');
const dashboard = document.getElementById('vaultDashboard');
const loader = document.getElementById('loader');

async function initLucid() {
    lucid = await Lucid.new(
        new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprod_YOUR_API_KEY"),
        "Preprod"
    );
}

connectBtn.onclick = async () => {
    if (typeof window.cardano === 'undefined') return alert('Please install Nami or Eternl wallet!');
    try {
        const api = await window.cardano.nami.enable();
        if (!lucid) await initLucid();
        lucid.selectWallet(api);
        userAddr = await lucid.wallet.address();
        connectBtn.innerText = userAddr.substring(0, 8) + '...';
        connectBtn.classList.replace('bg-blue-600', 'bg-emerald-600');
    } catch (e) { console.error(e); }
};

document.getElementById('setupBtn').onclick = async () => {
    const target = parseFloat(document.getElementById('setupTarget').value);
    if (!target || target <= 0) return alert('Enter target goal.');
    
    showLoader(true);
    setTimeout(() => {
        vaultData.target = target;
        vaultData.current = 0;
        vaultData.active = true;
        
        setupView.classList.add('hidden');
        dashboard.classList.remove('hidden');
        updateUI();
        showLoader(false);
    }, 2000);
};

document.getElementById('depositBtn').onclick = async () => {
    const amt = parseFloat(document.getElementById('depositAmount').value);
    if (!amt || amt <= 0) return alert('Enter amount to deposit.');
    
    showLoader(true);
    setTimeout(() => {
        vaultData.current += amt;
        updateUI();
        showLoader(false);
        document.getElementById('depositAmount').value = '';
    }, 1500);
};

function updateUI() {
    document.getElementById('currentAda').innerText = vaultData.current.toFixed(2);
    document.getElementById('targetAda').innerText = vaultData.target.toFixed(2);
    
    const progress = Math.min((vaultData.current / vaultData.target) * 100, 100);
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressText').innerText = progress.toFixed(0) + '% Reached';
    
    const remaining = Math.max(vaultData.target - vaultData.current, 0);
    document.getElementById('remainingAda').innerText = '₳' + remaining.toFixed(2) + ' Remaining';

    const withdrawBtn = document.getElementById('withdrawBtn');
    const notification = document.getElementById('notification');

    if (vaultData.current >= vaultData.target) {
        withdrawBtn.disabled = false;
        withdrawBtn.className = "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/40";
        notification.classList.remove('hidden');
    }
}

function showLoader(show) {
    loader.classList.toggle('hidden', !show);
}

document.getElementById('withdrawBtn').onclick = () => {
    showLoader(true);
    setTimeout(() => {
        alert("Transaction successful! Funds released to your wallet.");
        vaultData = { target: 0, current: 0, active: false };
        dashboard.classList.add('hidden');
        setupView.classList.remove('hidden');
        showLoader(false);
    }, 2500);
};