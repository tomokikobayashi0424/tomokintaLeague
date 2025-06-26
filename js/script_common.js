///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// ヘッダー・navi・フッター
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
let currentMonthOffset = 0; // 現在の月を基準としたオフセット
let displaySeason = "current"; // "current" なら currentSeason, "all" なら全シーズン
let teamsData = [];
let matchDataL = {};
let matchDataT = {};
let matchDataLCoop = {};
let matchDataTCoop = {};
let lineChart = null;  // 折れ線グラフ用の変数
let barChart5Min = null;   // 5分間隔の棒グラフ用の変数
let barChart15Min = null;   // 15分間隔の棒グラフ用の変数

// **現在のリーグのタイプを取得**
let leagueType = document.getElementById("leagueSelect")?.value || "h"; // デフォルトは "l"（リーグ）

// **currentMatchData の初期化（`DOMContentLoaded` より前に設定）**
let currentMatchData = null;

// **ページロード時の処理**
document.addEventListener("DOMContentLoaded", async function () {
    // **JSONデータを取得してローカルストレージに保存**
    await fetchAndSaveJsonFromGitHub();

    // **ローカルストレージから最新データを取得**
    teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];
    matchDataL = JSON.parse(localStorage.getItem('matchDataL')) || {};
    matchDataT = JSON.parse(localStorage.getItem('matchDataT')) || {};
    matchDataLCoop = JSON.parse(localStorage.getItem('matchDataLCoop')) || {};
    matchDataTCoop = JSON.parse(localStorage.getItem('matchDataTCoop')) || {};
    switch (leagueType) {
        case "h":
            currentMatchData = matchDataL;
            break;
        case "l":
            currentMatchData = matchDataL;
            break;
        case "t":
            currentMatchData = matchDataT;
            break;
        case "lcoop":
            currentMatchData = matchDataLCoop;
            break;
        case "tcoop":
            currentMatchData = matchDataTCoop;
            break;
        default:
            console.warn("リーグタイプが不明です。デフォルトで matchDataL を設定します。");
            currentMatchData = matchDataL;
    }

    // **最初のタブを開く**
    let defaultTab = document.querySelector('.tablinks.active') || document.querySelector('.tablinks[onclick*="home-schedule"]');
    if (defaultTab) {
        openTab(null, defaultTab.getAttribute('onclick').match(/'([^']+)'/)[1]);
    } else {
        openTab(null, "home-schedule"); // 明示的に 'home' を開く
    }

    if (leagueType == "h"){
        // **チームデータの読み込み**
        const teamContainer = document.querySelector('.team-list');

        // **teamsData の要素数から totalTeamNum を設定**
        let totalTeamNum = teamsData.length;

        // **最大 teamId を取得（デフォルト値 11）**
        let maxTeamId = teamsData.length > 0 ? Math.max(...teamsData.map(t => t.teamId), 11) : 0;

        // **チームロゴを動的に生成**
        teamContainer.innerHTML = ""; // 既存の内容をクリア
        for (let i = 0; i < totalTeamNum; i++) {
            let team = teamsData[i] || {
                teamId: maxTeamId + i,
                teams: `Team${i + 1}`,
                teamsSub: `Sub${i + 1}`,
                teamsColor: '000000',
                teamsSubColor: '000000',
                teamsTextColor: 'FFFFFF',
                teamsBgColor: 'FFFFFF'
            };

            const teamItem = `
                <div class="team-item">
                    <button class="team-logo-button" data-team="${team.teams}">
                        <ul>
                            <li>
                                <a href="javascript:void(0)" class="tablinks" onclick="openTabWithTeam(event, 'teamPerformanceTab', ${team.teamId})">
                                    <img src="Pictures/Team${team.teamId}.jpg" alt="${team.teams}" class="team-logo">
                                </a>
                            </li>
                        </ul>
                    </button>
                    <span class="team-name">${team.teams}</span>
                    <span class="team-subname">${team.teamsSub}</span><br>
                </div>
            `;
            teamContainer.insertAdjacentHTML('beforeend', teamItem);
        }
    } else{
        // **シーズンリストを作成**
    // populateSeasonDropdown();
    updateSeasonDropdown(); // プルダウン更新
    // **現在のシーズンを画面に表示**
    let seasonText = document.getElementById("seasonDisplayText");
    if (seasonText) {
        seasonText.textContent = `${currentSeason}`;
    }
    }
    
    // **画面のデータを更新**
    updateAllDisplayData();


    
});

// タブを切り替える関数
function openTab(evt, tabName) {
    let tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";  
    }

    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");  
    }

    document.getElementById(tabName).style.display = "block";

    // `evt` が null の場合（タブを手動で開く場合）は、対応するリンクを探して `active` を付与
    if (evt) {
        evt.currentTarget.classList.add("active");
    } else {
        let targetLink = document.querySelector(`.tablinks[onclick*="${tabName}"]`);
        if (targetLink) {
            targetLink.classList.add("active");
        }
    }
}

// function toggleLeagueSelect() {
//     const select = document.getElementById('leagueSelect');
//     select.style.display = (select.style.display === 'none' || select.style.display === '') ? 'block' : 'none';
// }


// リーグ変更プルダウンに関する関数
function changeLeague() {
    let leagueSelect = document.getElementById("leagueSelect");
    let selectedLeague = leagueSelect.value;

    if (selectedLeague === "l") {
        window.location.href = "index_l.html"; // Tomokinta League へ移動
    } else if (selectedLeague === "t") {
        window.location.href = "index_t.html"; // t へ移動
    } else if (selectedLeague === "lcoop") {
        window.location.href = "index_lcoop.html"; // l Co-op へ移動
    } else if (selectedLeague === "tcoop") {
        window.location.href = "index_tcoop.html"; // t Co-op へ移動
    }
}

// シーズン選択プルダウンを更新する関数（削除・追加の両方に対応）
// function updateSeasonDropdown() {
//     let seasonSelect = document.getElementById("seasonSelect");
    

//     // 既存の <option> をクリア
//     seasonSelect.innerHTML = '';

//     // シーズンのリストを取得
//     let seasons = Object.keys(currentMatchData);

//     // シーズンが1つもない場合、デフォルトのシーズン "24-s1" を作成
//     if (seasons.length === 0) {
//         seasons = ["24-s1"]; // デフォルトのシーズン
//         currentMatchData["24-s1"] = {}; // 空データをセット
//         localStorage.setItem('currentMatchData', JSON.stringify(currentMatchData));
//     }

//     // `currentSeason` が削除された場合、新しいシーズンを設定
//     // if (!seasons.includes(window.currentSeason)) {
//     //     window.currentSeason = seasons.length > 0 ? seasons[0] : "24-s1";
//     // }

//     // シーズンプルダウンリストを作成
//     seasons.forEach(season => {
//         let option = document.createElement("option");
//         option.value = season;
//         option.textContent = season;

//         if (season === window.currentSeason) {
//             option.selected = true; // `currentSeason` の場合は選択状態にする
//         }

//         seasonSelect.appendChild(option);
//     });
// }
function updateSeasonDropdown() {
    let seasonSelect = document.getElementById("seasonSelect");
    seasonSelect.innerHTML = '';

    let seasons = Object.keys(currentMatchData);

    // デフォルトの処理
    if (seasons.length === 0) {
        seasons = ["24-s1"];
        currentMatchData["24-s1"] = {};
        localStorage.setItem('currentMatchData', JSON.stringify(currentMatchData));
    }

    // `-s` の数字部分で降順ソート（大きいものが先）
    seasons.sort((a, b) => {
        const getSeasonNumber = (key) => {
            const match = key.match(/-s(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        };
        return getSeasonNumber(b) - getSeasonNumber(a);
    });

    // 最新シーズンを先頭に
    window.currentSeason = seasons[0];

    // プルダウン生成
    seasons.forEach(season => {
        let option = document.createElement("option");
        option.value = season;
        option.textContent = season;
        if (season === window.currentSeason) {
            option.selected = true;
        }
        seasonSelect.appendChild(option);
    });
}


// シーズン変更時の処理
function changeSeason() {
    let seasonSelect = document.getElementById('seasonSelect');
    window.currentSeason = seasonSelect.value; // グローバル変数を更新

    // シーズン変更後に画面を更新する（必要に応じて関数を呼び出す）
    updateAllDisplayData();
}


// チームの文字色を白か黒か選択する関数
function getTextColor(bgColor) {
    let r = parseInt(bgColor.substring(0, 2), 16); // 赤成分
    let g = parseInt(bgColor.substring(2, 4), 16); // 緑成分
    let b = parseInt(bgColor.substring(4, 6), 16); // 青成分
    let brightness = (r * 299 + g * 587 + b * 114) / 1000; // 輝度計算

    return brightness > 200 ? "606060" : "FFFFFF"; // 明るい色なら黒、暗い色なら白
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// ホームタブ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// GitHubリポジトリからJSONデータを取得し、ローカルストレージに保存する関数
function fetchAndSaveJsonFromGitHub() {
    // const url = './league_data.json'; // JSONファイルの相対パス
    const url = 'https://raw.githubusercontent.com/tomokikobayashi0424/tomokintaLeague/master/league_data.json'; // GitHubから取得する場合はこちらを有効化

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('GitHubからデータを取得できませんでした');
            }
            return response.json();
        })
        .then(data => {
            // matchData, teamsData などをローカルストレージに保存
            Object.entries(data).forEach(([key, value]) => {
                if (value) localStorage.setItem(key, JSON.stringify(value));
            });
        })
        .catch(error => console.error('データ取得エラー:', error));
}



///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 日程タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 画面幅に応じてチーム名を選択する関数
function getTeamNameByScreenSize(team) {
    // 画面幅を取得
    let screenWidth = window.innerWidth;

    // 画面幅が一定の幅（例えば600px以下）なら短い名前を表示
    if (screenWidth <= 600) {
        return team.teamsSub; // 短い名前を表示
    } else {
        return team.teams; // 通常の名前を表示
    }
}

// 現在のラウンドを計算する関数
function calculateCurrentRound(startDate, numRounds) {
    const today = new Date();
    
    // リーグ開始前なら第1節
    if (today < startDate) return 0;

    // 経過日数を計算
    const dayDifference = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const weekDifference = Math.floor(dayDifference / 7);

    // 節の範囲を制限（最終節を超えないように）
    return Math.min(weekDifference, numRounds - 1);
}

// 試合詳細のスタッツ表を生成する関数
function generateStatsTable(roundIndex, matchIndex) {
    const statCategories = ["支配率 (%)", "シュート", "枠内シュート", "ファウル", "オフサイド", 
                            "コーナーキック", "フリーキック回数", "パス", "パス成功", 
                            "クロス", "パスカット", "タックル成功", "セーブ"];

    // スタッツテーブルを生成
    const statsTable = createStatsTable(statCategories, roundIndex, matchIndex);
    
    return statsTable;
}

// ラウンドを表示する関数
function showRound(round) {
    let allRounds = document.querySelectorAll('.round');
    allRounds.forEach((roundDiv, index) => {
        roundDiv.style.display = index === round ? 'block' : 'none';
    });
}

// 前節ボタンをクリックした時の処理
function previousRound() {
    if (currentRound > 0) {
        currentRound--;
        showRound(currentRound);
    }
}

// 次節ボタンをクリックした時の処理
function nextRound() {
    let allRounds = document.querySelectorAll('.round');
    if (currentRound < allRounds.length - 1) {
        currentRound++;
        showRound(currentRound);
    }
}

// 得点の詳細タブ追加に関する関数
function updateGoalDetails(roundIndex, matchIndex, teamType, data = null) {
    let goalDetailsBody = document.getElementById(`goalDetailsBody${roundIndex}-${matchIndex}`);

    // スコアに基づいて得点詳細行を生成
    let score = data ? data.score : parseInt(document.getElementById(`${teamType}Score${roundIndex}-${matchIndex}`).value) || 0;
    let assistPlayers = data ? data.assistPlayers : [];
    let goalPlayers = data ? data.goalPlayers : [];
    let times = data ? data.times : [];

    // 既存のゴール詳細行を削除（ホーム・アウェイそれぞれ個別に行を管理）
    let existingRows = Array.from(goalDetailsBody.querySelectorAll('tr'));
    let currentRows = existingRows.filter(row => row.querySelector(`.goal-time.${teamType}`));

    // 既存行数と新しい得点に基づいて、行の増減を行う
    if (currentRows.length > score) {
        // 行を削除（得点が減った場合）
        for (let i = currentRows.length - 1; i >= score; i--) {
            goalDetailsBody.removeChild(currentRows[i]);
        }
    } else if (currentRows.length < score) {
        // 行を追加（得点が増えた場合）
        for (let i = currentRows.length; i < score; i++) {
            let assist = assistPlayers[i] || '';
            let goal = goalPlayers[i] || '';
            let time = times[i] || '';

            let rowHTML = `
                <tr>
                    <td colspan="2">
                        ${teamType === 'home' ? `
                            アシスト：<input type="text" class="assist-player home" value="${assist}">
                            ゴール　：<input type="text" class="goal-player home" value="${goal}">
                        ` : `<span></span>`}
                    </td>
                    <td>
                        <input type="number" class="goal-time ${teamType}" value="${time}" min="0" step="1" onchange="sortGoalDetails(${roundIndex}, ${matchIndex})"> 分
                    </td>

                    <td colspan="2">
                        ${teamType === 'away' ? `
                            アシスト：<input type="text" class="assist-player away" value="${assist}">
                            ゴール　：<input type="text" class="goal-player away" value="${goal}">
                        ` : `<span></span>`}
                    </td>
                </tr>
            `;
            goalDetailsBody.insertAdjacentHTML('beforeend', rowHTML);
        }
    }

    // 行の並び替えを適用
    sortGoalDetails(roundIndex, matchIndex);
}

// 時間に合わせて得点情報を並べ替える関数
function sortGoalDetails(roundIndex, matchIndex) {
    let goalDetailsBody = document.getElementById(`goalDetailsBody${roundIndex}-${matchIndex}`);
    let rows = Array.from(goalDetailsBody.querySelectorAll('tr'));

    // 時間を取得して並び替え
    rows.sort((rowA, rowB) => {
        let timeA = rowA.querySelector('.goal-time').value.replace('分', '') || '9999';
        let timeB = rowB.querySelector('.goal-time').value.replace('分', '') || '9999';

        return parseInt(timeA) - parseInt(timeB);
    });

    // 並び替え後の行を再配置
    rows.forEach(row => goalDetailsBody.appendChild(row));
}


// 日程表の自動スクロールする関数
function scrollToMatch(targetId) {
    let targetElement = document.getElementById(targetId);
    if (targetElement) {
        let offset = 200; // 固定ヘッダー分のオフセット
        let elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
        let offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 個人戦績タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// ランキングアップデート関数（チーム名なし）
function updatePlayerRecords(tableId, recordTypes) {
    if (!currentMatchData[currentSeason]) return;

    let records = {};

    Object.keys(currentMatchData[currentSeason]).forEach(matchKey => {
        if (["teamsNum", "currentStandings", "newDate"].includes(matchKey)) return;

        let match = currentMatchData[currentSeason][matchKey];

        ["home", "away"].forEach(side => {
            if (!match[side]) return;

            // `recordTypes` が配列でない場合は、配列に変換
            let recordTypeArray = Array.isArray(recordTypes) ? recordTypes : [recordTypes];

            recordTypeArray.forEach(recordType => {
                match[side][recordType]?.forEach(player => {
                    if (player && player.trim() !== "") { // 空白データを無視
                        records[player] = (records[player] || 0) + 1;
                    }
                });
            });
        });
    });

    displayPlayerRanking(tableId, records);
}

// ランキング表示（チーム名なし）
function displayPlayerRanking(tableId, records) {
    let table = document.getElementById(tableId);
    if (!table) return;

    let sortedRecords = Object.entries(records).sort((a, b) => b[1] - a[1]);
    let tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    let rank = 1, prevScore = null, displayRank = rank;

    sortedRecords.forEach(([player, count], index) => {
        if (prevScore !== count) displayRank = rank;
        prevScore = count;
        rank++;

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${displayRank}</td>  <!-- 順位 -->
                <td>${player}</td>  <!-- 選手名 -->
                <td>${count}</td>  <!-- 記録数 -->
            </tr>
        `);
    });
}

// プルダウンで表示する表を切り替え
function toggleRecordTable() {
    document.querySelectorAll(".recordTable").forEach(table => table.classList.remove("active"));
    document.getElementById(document.getElementById("recordSelect").value).classList.add("active");
}





//console.log("Team Colors:", teamColors);