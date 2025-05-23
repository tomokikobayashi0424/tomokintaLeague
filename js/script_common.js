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
let leagueType = document.getElementById("leagueSelect")?.value || "l"; // デフォルトは "l"（リーグ）

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
    let defaultTab = document.querySelector('.tablinks.active') || document.querySelector('.tablinks[onclick*="home"]');
    if (defaultTab) {
        openTab(null, defaultTab.getAttribute('onclick').match(/'([^']+)'/)[1]);
    } else {
        openTab(null, "home"); // 明示的に 'home' を開く
    }

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

    // **シーズンリストを作成**
    // populateSeasonDropdown();
    updateSeasonDropdown(); // プルダウン更新

    // **現在のシーズンを画面に表示**
    let seasonText = document.getElementById("seasonDisplayText");
    if (seasonText) {
        seasonText.textContent = `${currentSeason}`;
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
        window.location.href = "index.html"; // Tomokinta League へ移動
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
// チームスタッツ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// チームの文字色を白か黒か選択する関数
function getTextColor(bgColor) {
    let r = parseInt(bgColor.substring(0, 2), 16); // 赤成分
    let g = parseInt(bgColor.substring(2, 4), 16); // 緑成分
    let b = parseInt(bgColor.substring(4, 6), 16); // 青成分
    let brightness = (r * 299 + g * 587 + b * 114) / 1000; // 輝度計算

    return brightness > 200 ? "606060" : "FFFFFF"; // 明るい色なら黒、暗い色なら白
}

// チームスタッツを開く関数
function openTabWithTeam(evt, tabName, teamIndex) {
    // タブの切り替え
    openTab(evt, tabName);

    // クリックしたロゴに対応するチーム名を取得
    const team = teamsData.find(t => t.teamId === teamIndex);
    if (team) {
        const teamName = team.teams || `Team ${teamIndex + 1}`;
        const teamColor = team.teamsColor || 'FFFFFF'; // デフォルト背景色：白
        const teamSubColor = team.teamsSubColor || '000000'; // デフォルト文字色：黒
        // const teamTextColor = team.teamsTextColor || '000000'; // デフォルト背景色：白
        const teamBgColor = team.teamsBgColor || 'FFFFFF'; // デフォルト文字色：黒
        // let teamColor2 = teamInfo ? `#${teamInfo.teamsColor}` : "#FFFFFF"; // デフォルト白
        let textColor = getTextColor(teamColor);

        // CSS変数を更新
        document.documentElement.style.setProperty('--team-color-1', `#${teamColor}`);
        document.documentElement.style.setProperty('--teamsub-color-1', `#${teamSubColor}`);
        document.documentElement.style.setProperty('--teamtext-color-1', `#000000`);
        document.documentElement.style.setProperty('--teambg-color-1', `#${teamBgColor}`);
        document.documentElement.style.setProperty('--teamhead-color-1', `#${textColor}`);

        // タブのタイトルにチーム名を設定
        const teamHeader = document.getElementById('teamNameHeader');
        teamHeader.textContent = teamName;
        teamHeader.setAttribute('data-team-id', teamIndex);

        // 初回に現在の月のスケジュールを表示
        // currentMonthOffset = 0;
        // チーム日程を表示
        displayTeamMonthlySchedule(teamIndex);
        toggleSeasonView();
        // チーム戦績を表示
        calculateTeamAndOpponentStats(teamIndex); 
    }
}

// チームスタッツを閉じる関数
function closeTeamPerformanceTab() {
    document.getElementById('teamPerformanceTab').style.display = 'none';
    openTab(null, "home"); // ホームタブをアクティブにする
}

// 前の月を表示
function previousMonth() {
    currentMonthOffset--;
    const teamId = parseInt(document.getElementById('teamNameHeader').getAttribute('data-team-id'));
    displayTeamMonthlySchedule(teamId);
}

// 次の月を表示
function nextMonth() {
    currentMonthOffset++;
    const teamId = parseInt(document.getElementById('teamNameHeader').getAttribute('data-team-id'));
    displayTeamMonthlySchedule(teamId);
}

// シーズン選択
function toggleSeasonView() {
    let leagueSelect = document.getElementById("leagueSelect");
    let selectedLeague = leagueSelect.value; // 現在選択されているリーグを取得

    // **Tomokinta League ("l") の場合のみ current/all の切り替えを許可**
    if (selectedLeague === "l") {
        displaySeason = (displaySeason === "current") ? "all" : "current";
    } else {
        displaySeason = "all"; // その他のリーグでは常に "all"
    }

    let seasonText = document.getElementById("seasonDisplayText");
    seasonText.textContent = (displaySeason === "all") ? "All" : `${currentSeason}`;

    // **表示データを更新**
    let teamIndex = document.getElementById('teamNameHeader').getAttribute('data-team-id');
    displayTeamMonthlySchedule(parseInt(teamIndex));
    // **チーム戦績を表示**
    calculateTeamAndOpponentStats(parseInt(teamIndex));
}

// チーム日程表の表示
// function displayTeamMonthlySchedule(teamId) {
//     let scheduleHTML = '';
//     let allMatches = []; // すべての試合データを格納する配列

//     let displayMonth = new Date();
//     displayMonth.setDate(1);
//     displayMonth.setMonth(displayMonth.getMonth() + currentMonthOffset);
//     const displayYear = displayMonth.getFullYear();
//     const displayMonthIndex = displayMonth.getMonth();

//     // **全てのシーズンの試合データを対象にする**
//     let targetSeasons = [...new Set([...Object.keys(matchDataL), ...Object.keys(matchDataT), ...Object.keys(matchDataLCoop)])];

//     targetSeasons.forEach(season => {
//         let startDate = new Date(matchDataL[season]?.newDate || matchDataT[season]?.newDate || matchDataLCoop[season]?.newDate || new Date());
//         let roundDates = {};
//         let rounds = 0;

//         // **リーグ戦のラウンド数を計算**
//         if (matchDataL[season]) {
//             for (const matchKey in matchDataL[season]) {
//                 if (matchKey.startsWith("round")) {
//                     let roundNumber = parseInt(matchKey.match(/round(\d+)/)?.[1], 10);
//                     if (!isNaN(roundNumber)) {
//                         rounds = Math.max(rounds, roundNumber);
//                     }
//                 }
//             }

//             // 各ラウンドの日付を設定（1週間ごと）
//             for (let i = 0; i <= rounds; i++) {
//                 roundDates[`round${i}`] = new Date(startDate);
//                 roundDates[`round${i}`].setDate(startDate.getDate() + i * 7);
//             }
//         }

//         // **リーグ戦・トーナメント・チーム戦の試合データを統一的に処理**
//         ["L", "T", "C"].forEach(type => {
//             let matchData = type === "L" ? matchDataL[season] 
//                           : type === "T" ? matchDataT[season] 
//                           : matchDataLCoop[season];

//             let matchType = type === "L" ? "リーグ戦" 
//                           : type === "T" ? "トーナメント" 
//                           : "チーム戦";

//             if (!matchData) return;

//             for (const matchKey in matchData) {
//                 if (matchKey === "teamsNum" || matchKey === "currentStandings" || matchKey === "newDate") continue;

//                 let match = matchData[matchKey];
//                 if (!match) continue; // 試合データがない場合スキップ

//                 let roundNumber = type === "L" ? matchKey.split('-')[0] : matchKey.match(/round(\d+)/)?.[1];
//                 let matchDate = match.date ? new Date(match.date) : new Date(startDate);

//                 if (type === "T" || type === "C") {
//                     if (roundNumber) {
//                         matchDate.setDate(startDate.getDate() + parseInt(roundNumber, 10) * 7); // ラウンドごとに1週間ずつ進める
//                     }
//                 } else if (type === "L") {
//                     matchDate = roundDates[roundNumber] || matchDate; // リーグ戦は計算済みのラウンド日付を適用
//                 }

//                 if (matchDate.getFullYear() !== displayYear || matchDate.getMonth() !== displayMonthIndex) continue;

//                 // **チーム戦の処理**
//                 let isHome = false;
//                 let isAway = false;
//                 let opponentTeamNames = "";

//                 if (type === "C") {
//                     isHome = match.home.teamIds.includes(teamId);
//                     isAway = match.away.teamIds.includes(teamId);

//                     if (isHome || isAway) {
//                         opponentTeamNames = (isHome ? match.away.teamIds : match.home.teamIds)
//                             .map(opponentId => {
//                                 let team = teamsData.find(team => team.teamId === opponentId);
//                                 return team ? team.teams : null; // **不明なら null にする**
//                             })
//                             .filter(name => name !== null) // **不明を削除**
//                             .join("<br>");
//                     }
//                 } else {
//                     isHome = match.home.teamId === teamId;
//                     isAway = match.away.teamId === teamId;

//                     if (isHome || isAway) {
//                         let opponentTeam = teamsData.find(team => team.teamId === (isHome ? match.away.teamId : match.home.teamId));
//                         opponentTeamNames = opponentTeam ? opponentTeam.teams : null; // **不明なら null にする**
//                     }
//                 }

//                 if (!isHome && !isAway) continue; // 該当チームの試合でなければスキップ
//                 if (!opponentTeamNames) continue; // **対戦相手が不明ならスキップ**

//                 let scoreClass = '';
//                     if (isHome && match.home.score !== null && match.away.score !== null) {
//                         if (match.home.score > match.away.score) {
//                             scoreClass = 'highlight-green';
//                         } else if (match.home.score < match.away.score) {
//                             scoreClass = 'highlight-red';
//                         }
//                     } else if (isAway && match.home.score !== null && match.away.score !== null) {
//                         if (match.away.score > match.home.score) {
//                             scoreClass = 'highlight-green';
//                         } else if (match.away.score < match.home.score) {
//                             scoreClass = 'highlight-red';
//                         }
//                     }

//                 allMatches.push({
//                     matchDate,
//                     season,
//                     matchType,
//                     location: isHome ? 'home' : 'away',
//                     opponent: opponentTeamNames, // **対戦相手を改行表示**
//                     score: `${match.home.score ?? '-'} - ${match.away.score ?? '-'}`,
//                     scoreClass
//                 });
//             }
//         });
//     });

//     // **試合データを日付順にソート**
//     allMatches.sort((a, b) => a.matchDate - b.matchDate);

//     // **HTMLを生成**
//     allMatches.forEach(match => {
//         scheduleHTML += `
//             <tr>
//                 <td>${match.matchDate.getDate()}日</td>
//                 <td>${match.season}</td>
//                 <td>${match.location}</td>
//                 <td>${match.opponent}</td>
//                 <td class="${match.scoreClass}">${match.score}</td>
//             </tr>
//         `;
//     });

//     if (scheduleHTML === '') {
//         scheduleHTML = `<tr><td colspan="6">この月の試合はありません</td></tr>`;
//     }

//     document.getElementById('teamScheduleTableBody').innerHTML = scheduleHTML;
//     document.getElementById('currentMonthLabel').textContent = `${displayYear}年${displayMonthIndex + 1}月`;
// }
function displayTeamMonthlySchedule(teamId) {
    let scheduleHTML = '';
    let allMatches = [];

    let displayMonth = new Date();
    displayMonth.setDate(1);
    displayMonth.setMonth(displayMonth.getMonth() + currentMonthOffset);
    const displayYear = displayMonth.getFullYear();
    const displayMonthIndex = displayMonth.getMonth();

    let targetSeasons = [...new Set([...Object.keys(matchDataL), ...Object.keys(matchDataT), ...Object.keys(matchDataLCoop)])];

    targetSeasons.forEach(season => {
        let startDate = new Date(matchDataL[season]?.newDate || matchDataT[season]?.newDate || matchDataLCoop[season]?.newDate || new Date());
        let roundDates = {};
        let rounds = 0;

        if (matchDataL[season]) {
            for (const matchKey in matchDataL[season]) {
                if (matchKey.startsWith("round")) {
                    let roundNumber = parseInt(matchKey.match(/round(\d+)/)?.[1], 10);
                    if (!isNaN(roundNumber)) {
                        rounds = Math.max(rounds, roundNumber);
                    }
                }
            }

            for (let i = 0; i <= rounds; i++) {
                roundDates[`round${i}`] = new Date(startDate);
                roundDates[`round${i}`].setDate(startDate.getDate() + i * 7);
            }
        }

        ["L", "T", "C"].forEach(type => {
            let matchData = type === "L" ? matchDataL[season]
                          : type === "T" ? matchDataT[season]
                          : matchDataLCoop[season];

            let matchType = type === "L" ? "リーグ戦"
                          : type === "T" ? "トーナメント"
                          : "チーム戦";

            if (!matchData) return;

            for (const matchKey in matchData) {
                if (["teamsNum", "currentStandings", "newDate"].includes(matchKey)) continue;

                let match = matchData[matchKey];
                if (!match) continue;

                let roundNumber = type === "L" ? matchKey.split('-')[0] : matchKey.match(/round(\d+)/)?.[1];

                let matchDate;
                if (match.date) {
                    matchDate = new Date(match.date); // ← 優先的に使う
                } else {
                    matchDate = new Date(startDate);
                    if (type === "T" || type === "C") {
                        if (roundNumber) {
                            matchDate.setDate(startDate.getDate() + parseInt(roundNumber, 10) * 7);
                        }
                    } else if (type === "L") {
                        matchDate = roundDates[roundNumber] || matchDate;
                    }
                }

                if (matchDate.getFullYear() !== displayYear || matchDate.getMonth() !== displayMonthIndex) continue;

                let isHome = false;
                let isAway = false;
                let opponentTeamNames = "";

                if (type === "C") {
                    isHome = match.home.teamIds.includes(teamId);
                    isAway = match.away.teamIds.includes(teamId);

                    if (isHome || isAway) {
                        opponentTeamNames = (isHome ? match.away.teamIds : match.home.teamIds)
                            .map(opponentId => {
                                let team = teamsData.find(team => team.teamId === opponentId);
                                return team ? team.teams : null;
                            })
                            .filter(name => name !== null)
                            .join("<br>");
                    }
                } else {
                    isHome = match.home.teamId === teamId;
                    isAway = match.away.teamId === teamId;

                    if (isHome || isAway) {
                        let opponentTeam = teamsData.find(team => team.teamId === (isHome ? match.away.teamId : match.home.teamId));
                        opponentTeamNames = opponentTeam ? opponentTeam.teams : null;
                    }
                }

                if (!isHome && !isAway) continue;
                if (!opponentTeamNames) continue;

                let scoreClass = '';
                if (isHome && match.home.score != null && match.away.score != null) {
                    if (match.home.score > match.away.score) scoreClass = 'highlight-green';
                    else if (match.home.score < match.away.score) scoreClass = 'highlight-red';
                } else if (isAway && match.home.score != null && match.away.score != null) {
                    if (match.away.score > match.home.score) scoreClass = 'highlight-green';
                    else if (match.away.score < match.home.score) scoreClass = 'highlight-red';
                }

                allMatches.push({
                    matchDate,
                    season,
                    matchType,
                    location: isHome ? 'home' : 'away',
                    opponent: opponentTeamNames,
                    score: `${match.home.score ?? '-'} - ${match.away.score ?? '-'}`,
                    scoreClass
                });
            }
        });
    });

    allMatches.sort((a, b) => a.matchDate - b.matchDate);

    allMatches.forEach(match => {
        scheduleHTML += `
            <tr>
                <td>${match.matchDate.getDate()}日</td>
                <td>${match.season}</td>
                <td>${match.location}</td>
                <td>${match.opponent}</td>
                <td class="${match.scoreClass}">${match.score}</td>
            </tr>
        `;
    });

    if (scheduleHTML === '') {
        scheduleHTML = `<tr><td colspan="6">この月の試合はありません</td></tr>`;
    }

    document.getElementById('teamScheduleTableBody').innerHTML = scheduleHTML;
    document.getElementById('currentMonthLabel').textContent = `${displayYear}年${displayMonthIndex + 1}月`;
}


// チームごとのプレイヤーランキングを表示する関数
function displayTeamPlayerRanking(tableId, players) {
    let sortedPlayers = Object.entries(players).sort((a, b) => b[1] - a[1]); // 得点順にソート
    let tbody = document.querySelector(`#${tableId} tbody`);
    
    if (!tbody) {
        console.error(`テーブルID ${tableId} が見つかりませんでした`);
        return;
    }

    tbody.innerHTML = '';  // テーブルを初期化

    let rank = 1;  // 順位
    let prevScore = null;  // 前のスコア
    let displayRank = rank; // 表示する順位

    sortedPlayers.forEach(([player, count], index) => {
        // 前のスコアと異なる場合は表示する順位を更新
        if (prevScore !== count) {
            displayRank = rank;  // 表示する順位を設定
        }

        prevScore = count;  // 前のスコアを更新
        rank++; // 次の順位へインクリメント

        let row = `
            <tr>
                <td>${displayRank}</td>  <!-- 順位 -->
                <td>${player}</td>  <!-- 選手名 -->
                <td>${count}</td>  <!-- 得点/アシスト数 -->
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// 全チームの統計データを集計する関数
function calculateOverallTeamStats() {
    let overallStats = {
        matches: 0,
        wins: 0,
        goals: 0,
        draws: 0,
        losses: 0,
        possession: 0,
        shots: 0,
        shotsonFrame: 0,
        shotsonFrameRate: 0,
        fouls: 0,
        offsides: 0,
        cornerKicks: 0,
        freeKicks: 0,
        passes: 0,
        successfulPasses: 0,
        passSuccessRate: 0,
        crosses: 0,
        PassCuts: 0,
        successfulTackles: 0,
        save: 0
    };

    // **すべてのシーズンの試合を集計**
    // let targetSeasons = Object.keys(matchDataL); // すべてのシーズンを取得
    let targetSeasons = (displaySeason === "all") ? Object.keys(matchDataL) : [currentSeason];

    targetSeasons.forEach(season => {
        if (!matchDataL[season]) return; // データがないシーズンはスキップ

        for (const matchKey in matchDataL[season]) {
            // `teamsNum` や `currentStandings` をスキップ
            if (matchKey === "teamsNum" || matchKey === "currentStandings"|| matchKey === "newDate") continue;

            const match = matchDataL[season][matchKey];

            // `match` が `undefined` の場合はスキップ
            if (!match || !match.home || !match.away) continue;

            // スコアが未入力の試合を無視
            const homeScore = match.home.score;
            const awayScore = match.away.score;
            if (homeScore === null || awayScore === null) continue;

            overallStats.matches += 2; // 両チーム分カウント

            overallStats.goals += homeScore + awayScore;
            overallStats.possession += (match.home.fullTime?.possession || 0) + (match.away.fullTime?.possession || 0);
            overallStats.shots += (match.home.fullTime?.shots || 0) + (match.away.fullTime?.shots || 0);
            overallStats.shotsonFrame += (match.home.fullTime?.shotsonFrame || 0) + (match.away.fullTime?.shotsonFrame || 0);
            overallStats.fouls += (match.home.fullTime?.fouls || 0) + (match.away.fullTime?.fouls || 0);
            overallStats.offsides += (match.home.fullTime?.offsides || 0) + (match.away.fullTime?.offsides || 0);
            overallStats.cornerKicks += (match.home.fullTime?.cornerKicks || 0) + (match.away.fullTime?.cornerKicks || 0);
            overallStats.freeKicks += (match.home.fullTime?.freeKicks || 0) + (match.away.fullTime?.freeKicks || 0);
            overallStats.passes += (match.home.fullTime?.passes || 0) + (match.away.fullTime?.passes || 0);
            overallStats.successfulPasses += (match.home.fullTime?.successfulPasses || 0) + (match.away.fullTime?.successfulPasses || 0);
            overallStats.crosses += (match.home.fullTime?.crosses || 0) + (match.away.fullTime?.crosses || 0);
            overallStats.PassCuts += (match.home.fullTime?.PassCuts || 0) + (match.away.fullTime?.PassCuts || 0);
            overallStats.successfulTackles += (match.home.fullTime?.successfulTackles || 0) + (match.away.fullTime?.successfulTackles || 0);
            overallStats.save += (match.home.fullTime?.save || 0) + (match.away.fullTime?.save || 0);

            if (homeScore > awayScore) {
                overallStats.wins++;
                overallStats.losses++;
            } else if (homeScore === awayScore) {
                overallStats.draws += 2;
            } else {
                overallStats.wins++;
                overallStats.losses++;
            }
        }
    });
    console.log("総合スタッツ:", overallStats);
    return overallStats;
}

// 特定のチームの統計データを集計する関数
function calculateTeamAndOpponentStats(teamId) {
    let stats = {
        team: {
            matches: 0,
            wins: 0,
            goals: 0,
            draws: 0,
            losses: 0,
            possession: 0,
            shots: 0,
            shotsonFrame: 0,
            shotsonFrameRate: 0,
            fouls: 0,
            offsides: 0,
            cornerKicks: 0,
            freeKicks: 0,
            passes: 0,
            successfulPasses: 0,
            passSuccessRate: 0,
            crosses: 0,
            PassCuts: 0,
            successfulTackles: 0,
            save: 0,
        },
        opponent: {
            matches: 0,
            goals: 0,
            possession: 0,
            shots: 0,
            shotsonFrame: 0,
            fouls: 0,
            offsides: 0,
            cornerKicks: 0,
            freeKicks: 0,
            passes: 0,
            successfulPasses: 0,
            passSuccessRate: 0,
            crosses: 0,
            PassCuts: 0,
            successfulTackles: 0,
            save: 0,
        },
    };

    let goalPlayers = {};
    let assistPlayers = {};

    // **すべてのシーズンの試合を集計**
    // let targetSeasons = Object.keys(matchDataL); // すべてのシーズンを取得
    let targetSeasons = (displaySeason === "all") ? Object.keys(matchDataL) : [currentSeason];


    targetSeasons.forEach(season => {
        if (!matchDataL[season]) return; // データがないシーズンはスキップ

        for (const matchKey in matchDataL[season]) {

            if (matchKey === "teamsNum" || matchKey === "currentStandings"|| matchKey === "newDate") continue;
            
            const match = matchDataL[season][matchKey];
            // `match` が `undefined` の場合はスキップ
            if (!match || !match.home || !match.away) continue;
            const isHome = match.home.teamId === teamId;
            const isAway = match.away.teamId === teamId;

            // スコアが未入力の試合を無視
            const homeScore = match.home.score;
            const awayScore = match.away.score;
            if (homeScore === null || awayScore === null) continue;

            if (isHome || isAway) {
                // 自チームの統計を集計
                const team = isHome ? match.home : match.away;
                const opponent = isHome ? match.away : match.home;

                stats.team.matches++;
                stats.team.goals += team.score || 0;
                stats.team.possession += team.fullTime.possession || 0;
                stats.team.shots += team.fullTime.shots || 0;
                stats.team.shotsonFrame += team.fullTime.shotsonFrame || 0;
                stats.team.fouls += team.fullTime.fouls || 0;
                stats.team.offsides += team.fullTime.offsides || 0;
                stats.team.cornerKicks += team.fullTime.cornerKicks || 0;
                stats.team.freeKicks += team.fullTime.freeKicks || 0;
                stats.team.passes += team.fullTime.passes || 0;
                stats.team.successfulPasses += team.fullTime.successfulPasses || 0;
                stats.team.crosses += team.fullTime.crosses || 0;
                stats.team.PassCuts += team.fullTime.PassCuts || 0;
                stats.team.successfulTackles += team.fullTime.successfulTackles || 0;
                stats.team.save += team.fullTime.save || 0;

                // ゴールとアシストのプレイヤーを集計
                const goalPlayersArray = team.goalPlayers || [];
                const assistPlayersArray = team.assistPlayers || [];

                if (Array.isArray(goalPlayersArray)) {
                    goalPlayersArray.forEach(player => {
                        if (player) {
                            goalPlayers[player] = (goalPlayers[player] || 0) + 1;
                        }
                    });
                }

                if (Array.isArray(assistPlayersArray)) {
                    assistPlayersArray.forEach(player => {
                        if (player) {
                            assistPlayers[player] = (assistPlayers[player] || 0) + 1;
                        }
                    });
                }

                // 勝敗を計算
                if ((isHome && homeScore > awayScore) || (isAway && awayScore > homeScore)) {
                    stats.team.wins++;
                } else if (homeScore === awayScore) {
                    stats.team.draws++;
                } else {
                    stats.team.losses++;
                }

                // 対戦相手の統計を集計
                stats.opponent.matches++;
                stats.opponent.goals += opponent.score || 0;
                stats.opponent.possession += opponent.fullTime.possession || 0;
                stats.opponent.shots += opponent.fullTime.shots || 0;
                stats.opponent.shotsonFrame += opponent.fullTime.shotsonFrame || 0;
                stats.opponent.fouls += opponent.fullTime.fouls || 0;
                stats.opponent.offsides += opponent.fullTime.offsides || 0;
                stats.opponent.cornerKicks += opponent.fullTime.cornerKicks || 0;
                stats.opponent.freeKicks += opponent.fullTime.freeKicks || 0;
                stats.opponent.passes += opponent.fullTime.passes || 0;
                stats.opponent.successfulPasses += opponent.fullTime.successfulPasses || 0;
                stats.opponent.crosses += opponent.fullTime.crosses || 0;
                stats.opponent.PassCuts += opponent.fullTime.PassCuts || 0;
                stats.opponent.successfulTackles += opponent.fullTime.successfulTackles || 0;
                stats.opponent.save += opponent.fullTime.save || 0;
            }
        }
    });


    // 自チームの戦績データを表示
    document.getElementById('matches-team').textContent = stats.team.matches;
    document.getElementById('wins-team-total').textContent = stats.team.wins;
    document.getElementById('draws-team-total').textContent = stats.team.draws;
    document.getElementById('losses-team-total').textContent = stats.team.losses;
    document.getElementById('wins-team-per').textContent = (stats.team.wins*100 / stats.team.matches).toFixed(2) + '%';
    document.getElementById('draws-team-per').textContent = (stats.team.draws*100 / stats.team.matches).toFixed(2) + '%';
    document.getElementById('losses-team-per').textContent = (stats.team.losses*100 / stats.team.matches).toFixed(2) + '%';
    
    document.getElementById('goals-team-total').textContent = stats.team.goals;
    document.getElementById('goals-team-avg').textContent = (stats.team.goals / stats.team.matches).toFixed(2);

    document.getElementById('possession-team').textContent = (stats.team.possession / stats.team.matches).toFixed(2) + '%';

    document.getElementById('shots-team-total').textContent = stats.team.shots;
    document.getElementById('shots-team-avg').textContent = (stats.team.shots / stats.team.matches).toFixed(2);
    document.getElementById('shotsonFrame-team-total').textContent = stats.team.shotsonFrame;
    document.getElementById('shotsonFrame-team-avg').textContent = (stats.team.shotsonFrame / stats.team.matches).toFixed(2);
    document.getElementById('shotsonFrame-team-per').textContent = (stats.team.shotsonFrame*100 / stats.team.shots).toFixed(2) + '%';
    document.getElementById('goals-team-per').textContent = (stats.team.goals*100 / stats.team.shots).toFixed(2) + '%';
    
    document.getElementById('fouls-team-total').textContent = stats.team.fouls;
    document.getElementById('fouls-team-avg').textContent = (stats.team.fouls / stats.team.matches).toFixed(2);
    document.getElementById('offsides-team-total').textContent = stats.team.offsides;
    document.getElementById('offsides-team-avg').textContent = (stats.team.offsides / stats.team.matches).toFixed(2);
    document.getElementById('cornerKicks-team-total').textContent = stats.team.cornerKicks;
    document.getElementById('cornerKicks-team-avg').textContent = (stats.team.cornerKicks / stats.team.matches).toFixed(2);
    document.getElementById('freeKicks-team-total').textContent = stats.team.freeKicks;
    document.getElementById('freeKicks-team-avg').textContent = (stats.team.freeKicks / stats.team.matches).toFixed(2);
    document.getElementById('passes-team-total').textContent = stats.team.passes;
    document.getElementById('passes-team-avg').textContent = (stats.team.passes / stats.team.matches).toFixed(2);
    document.getElementById('successfulPasses-team-total').textContent = stats.team.successfulPasses;
    document.getElementById('successfulPasses-team-avg').textContent = (stats.team.successfulPasses / stats.team.matches).toFixed(2);
    document.getElementById('successfulPasses-team-per').textContent = (stats.team.successfulPasses*100 / stats.team.passes).toFixed(2) + '%';
    document.getElementById('crosses-team-total').textContent = stats.team.crosses;
    document.getElementById('crosses-team-avg').textContent = (stats.team.crosses / stats.team.matches).toFixed(2);
    document.getElementById('PassCuts-team-total').textContent = stats.team.PassCuts;
    document.getElementById('PassCuts-team-avg').textContent = (stats.team.PassCuts / stats.team.matches).toFixed(2);
    document.getElementById('successfulTackles-team-total').textContent = stats.team.successfulTackles;
    document.getElementById('successfulTackles-team-avg').textContent = (stats.team.successfulTackles / stats.team.matches).toFixed(2);
    document.getElementById('saves-team-total').textContent = stats.team.save;
    document.getElementById('saves-team-avg').textContent = (stats.team.save / stats.team.matches).toFixed(2);
    document.getElementById('saves-team-per').textContent = (stats.team.save*100 / stats.opponent.shotsonFrame).toFixed(2) + '%';
    document.getElementById('saves2-team-per').textContent = ((stats.opponent.shotsonFrame-stats.opponent.goals)*100 / stats.opponent.shotsonFrame).toFixed(2) + '%';



    // 相手チームの戦績データを表示
    document.getElementById('matches-opp').textContent = stats.opponent.matches;
    document.getElementById('wins-opp-total').textContent = "-";
    document.getElementById('draws-opp-total').textContent = "-";
    document.getElementById('losses-opp-total').textContent = "-";
    document.getElementById('wins-opp-per').textContent = "-";
    document.getElementById('draws-opp-per').textContent = "-";
    document.getElementById('losses-opp-per').textContent = "-";
    
    document.getElementById('goals-opp-total').textContent = stats.opponent.goals;
    document.getElementById('goals-opp-avg').textContent = (stats.opponent.goals / stats.opponent.matches).toFixed(2);

    document.getElementById('possession-opp').textContent = (stats.opponent.possession / stats.opponent.matches).toFixed(2) + '%';

    document.getElementById('shots-opp-total').textContent = stats.opponent.shots;
    document.getElementById('shots-opp-avg').textContent = (stats.opponent.shots / stats.opponent.matches).toFixed(2);
    document.getElementById('shotsonFrame-opp-total').textContent = stats.opponent.shotsonFrame;
    document.getElementById('shotsonFrame-opp-avg').textContent = (stats.opponent.shotsonFrame / stats.opponent.matches).toFixed(2);
    document.getElementById('shotsonFrame-opp-per').textContent = (stats.opponent.shotsonFrame*100 / stats.opponent.shots).toFixed(2) + '%';
    document.getElementById('goals-opp-per').textContent = (stats.opponent.goals*100 / stats.opponent.shots).toFixed(2) + '%';
    
    document.getElementById('fouls-opp-total').textContent = stats.opponent.fouls;
    document.getElementById('fouls-opp-avg').textContent = (stats.opponent.fouls / stats.opponent.matches).toFixed(2);
    document.getElementById('offsides-opp-total').textContent = stats.opponent.offsides;
    document.getElementById('offsides-opp-avg').textContent = (stats.opponent.offsides / stats.opponent.matches).toFixed(2);
    document.getElementById('cornerKicks-opp-total').textContent = stats.opponent.cornerKicks;
    document.getElementById('cornerKicks-opp-avg').textContent = (stats.opponent.cornerKicks / stats.opponent.matches).toFixed(2);
    document.getElementById('freeKicks-opp-total').textContent = stats.opponent.freeKicks;
    document.getElementById('freeKicks-opp-avg').textContent = (stats.opponent.freeKicks / stats.opponent.matches).toFixed(2);
    document.getElementById('passes-opp-total').textContent = stats.opponent.passes;
    document.getElementById('passes-opp-avg').textContent = (stats.opponent.passes / stats.opponent.matches).toFixed(2);
    document.getElementById('successfulPasses-opp-total').textContent = stats.opponent.successfulPasses;
    document.getElementById('successfulPasses-opp-avg').textContent = (stats.opponent.successfulPasses / stats.opponent.matches).toFixed(2);
    document.getElementById('successfulPasses-opp-per').textContent = (stats.opponent.successfulPasses*100 / stats.opponent.passes).toFixed(2) + '%';
    document.getElementById('crosses-opp-total').textContent = stats.opponent.crosses;
    document.getElementById('crosses-opp-avg').textContent = (stats.opponent.crosses / stats.opponent.matches).toFixed(2);
    document.getElementById('PassCuts-opp-total').textContent = stats.opponent.PassCuts;
    document.getElementById('PassCuts-opp-avg').textContent = (stats.opponent.PassCuts / stats.opponent.matches).toFixed(2);
    document.getElementById('successfulTackles-opp-total').textContent = stats.opponent.successfulTackles;
    document.getElementById('successfulTackles-opp-avg').textContent = (stats.opponent.successfulTackles / stats.opponent.matches).toFixed(2);
    document.getElementById('saves-opp-total').textContent = stats.opponent.save;
    document.getElementById('saves-opp-avg').textContent = (stats.opponent.save / stats.opponent.matches).toFixed(2);
    document.getElementById('saves-opp-per').textContent = (stats.opponent.save*100 / stats.team.shotsonFrame).toFixed(2) + '%';
    document.getElementById('saves2-opp-per').textContent = ((stats.team.shotsonFrame-stats.team.goals)*100 / stats.team.shotsonFrame).toFixed(2) + '%';
    

    // 全体スタッツ（TL）の計算
    const overallStats = calculateOverallTeamStats();
    document.getElementById('matches-tl').textContent = overallStats.matches;
    document.getElementById('wins-tl-total').textContent = overallStats.wins;
    document.getElementById('draws-tl-total').textContent = overallStats.draws;
    document.getElementById('losses-tl-total').textContent = overallStats.losses;
    document.getElementById('wins-tl-per').textContent = (overallStats.wins*100 / overallStats.matches).toFixed(2) + '%';
    document.getElementById('draws-tl-per').textContent = (overallStats.draws*100 / overallStats.matches).toFixed(2) + '%';
    document.getElementById('losses-tl-per').textContent = (overallStats.losses*100 / overallStats.matches).toFixed(2) + '%';
    
    document.getElementById('goals-tl-total').textContent = overallStats.goals;
    document.getElementById('goals-tl-avg').textContent = (overallStats.goals / overallStats.matches).toFixed(2);

    document.getElementById('possession-tl').textContent = (overallStats.possession / overallStats.matches).toFixed(2) + '%';

    document.getElementById('shots-tl-total').textContent = overallStats.shots;
    document.getElementById('shots-tl-avg').textContent = (overallStats.shots / overallStats.matches).toFixed(2);
    document.getElementById('shotsonFrame-tl-total').textContent = overallStats.shotsonFrame;
    document.getElementById('shotsonFrame-tl-avg').textContent = (overallStats.shotsonFrame / overallStats.matches).toFixed(2);
    document.getElementById('shotsonFrame-tl-per').textContent = (overallStats.shotsonFrame*100 / overallStats.shots).toFixed(2) + '%';
    document.getElementById('goals-tl-per').textContent = (overallStats.goals*100 / overallStats.shots).toFixed(2) + '%';
    
    document.getElementById('fouls-tl-total').textContent = overallStats.fouls;
    document.getElementById('fouls-tl-avg').textContent = (overallStats.fouls / overallStats.matches).toFixed(2);
    document.getElementById('offsides-tl-total').textContent = overallStats.offsides;
    document.getElementById('offsides-tl-avg').textContent = (overallStats.offsides / overallStats.matches).toFixed(2);
    document.getElementById('cornerKicks-tl-total').textContent = overallStats.cornerKicks;
    document.getElementById('cornerKicks-tl-avg').textContent = (overallStats.cornerKicks / overallStats.matches).toFixed(2);
    document.getElementById('freeKicks-tl-total').textContent = overallStats.freeKicks;
    document.getElementById('freeKicks-tl-avg').textContent = (overallStats.freeKicks / overallStats.matches).toFixed(2);
    document.getElementById('passes-tl-total').textContent = overallStats.passes;
    document.getElementById('passes-tl-avg').textContent = (overallStats.passes / overallStats.matches).toFixed(2);
    document.getElementById('successfulPasses-tl-total').textContent = overallStats.successfulPasses;
    document.getElementById('successfulPasses-tl-avg').textContent = (overallStats.successfulPasses / overallStats.matches).toFixed(2);
    document.getElementById('successfulPasses-tl-per').textContent = (overallStats.successfulPasses*100 / overallStats.passes).toFixed(2) + '%';
    document.getElementById('crosses-tl-total').textContent = overallStats.crosses;
    document.getElementById('crosses-tl-avg').textContent = (overallStats.crosses / overallStats.matches).toFixed(2);
    document.getElementById('PassCuts-tl-total').textContent = overallStats.PassCuts;
    document.getElementById('PassCuts-tl-avg').textContent = (overallStats.PassCuts / overallStats.matches).toFixed(2);
    document.getElementById('successfulTackles-tl-total').textContent = overallStats.successfulTackles;
    document.getElementById('successfulTackles-tl-avg').textContent = (overallStats.successfulTackles / overallStats.matches).toFixed(2);
    document.getElementById('saves-tl-total').textContent = overallStats.save;
    document.getElementById('saves-tl-avg').textContent = (overallStats.save / overallStats.matches).toFixed(2);
    document.getElementById('saves-tl-per').textContent = (overallStats.save*100 / overallStats.shotsonFrame).toFixed(2) + '%';
    document.getElementById('saves2-tl-per').textContent = ((overallStats.shotsonFrame-overallStats.goals)*100 / overallStats.shotsonFrame).toFixed(2) + '%';



    // ゴールとアシストランキングの表示
    displayTeamPlayerRanking('teamGoalPlayersTable', goalPlayers);  // チームゴールランキング
    displayTeamPlayerRanking('teamAssistPlayersTable', assistPlayers);  // チームアシストランキング

    // ゴール・失点グラフの描画
    drawGoalGraph(teamId);

    return stats;
}

// ゴールと失点のグラフを描画する関数
function drawGoalGraph(teamId) {
    let goalTimes = [];
    let concededTimes = [];

    // **すべてのシーズンの試合データを処理**
    // let targetSeasons = Object.keys(matchDataL); // 全シーズンを取得
    let targetSeasons = (displaySeason === "all") ? Object.keys(matchDataL) : [currentSeason];

    targetSeasons.forEach(season => {
        if (!matchDataL[season]) return; // データがないシーズンはスキップ

        for (const matchKey in matchDataL[season]) {
            // `teamsNum` や `currentStandings` をスキップ
            if (matchKey === "teamsNum" || matchKey === "currentStandings" || matchKey === "newDate") continue;

            const match = matchDataL[season][matchKey];

            // `match` が `undefined` の場合はスキップ
            if (!match || !match.home || !match.away) continue;

            const isHome = match.home.teamId === teamId;
            const isAway = match.away.teamId === teamId;

            if (isHome) {
                goalTimes = goalTimes.concat(match.home.times || []);
                concededTimes = concededTimes.concat(match.away.times || []);
            } else if (isAway) {
                goalTimes = goalTimes.concat(match.away.times || []);
                concededTimes = concededTimes.concat(match.home.times || []);
            }
        }
    });

    goalTimes.sort((a, b) => a - b);
    concededTimes.sort((a, b) => a - b);

    createGoalScatterPlot(goalTimes, concededTimes);  // 折れ線グラフの作成（線なし）
    drawStackedGoalGraph(goalTimes, concededTimes, 5);  // 5分刻みの棒グラフ
    drawStackedGoalGraph(goalTimes, concededTimes, 15); // 15分刻みの棒グラフ
}

// 折れ線グラフ（プロットのみ）を作成する関数
function createGoalScatterPlot(goalTimes, concededTimes) {
    const ctx = document.getElementById('goalChart').getContext('2d');
    ctx.canvas.style.backgroundColor = 'white';  // グラフの背景を白に設定

    if (lineChart) {
        lineChart.destroy();
    }

    const goalCounts = {};
    const concededCounts = {};

    goalTimes.forEach(time => {
        goalCounts[time] = (goalCounts[time] || 0) + 1;
    });

    concededTimes.forEach(time => {
        concededCounts[time] = (concededCounts[time] || 0) + 1;
    });

    const maxGoals = Math.max(...Object.values(goalCounts), ...Object.values(concededCounts), 0);
    const yMax = maxGoals + 1;

    lineChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '得点',
                    data: Object.keys(goalCounts).map(time => ({ x: parseInt(time), y: goalCounts[time] })),
                    backgroundColor: '#32CD32',
                    pointStyle: 'triangle',  // 自チーム得点のマーカー形状
                    pointRadius: 6,
                    showLine: false
                },
                {
                    label: '失点',
                    data: Object.keys(concededCounts).map(time => ({ x: parseInt(time), y: concededCounts[time] })),
                    backgroundColor: '#FF0000',
                    pointStyle: 'rect',  // 失点のマーカー形状
                    pointRadius: 6,
                    showLine: false
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: '得点時間と失点時間のグラフ',
                    color: 'rgb(0, 0, 0)', // タイトル文字色
                    font: { size: 20 }
                },
                legend: {
                    labels: {
                        
                        font: { size: 12 } // 凡例フォントサイズ
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 90,
                    title: { display: true, text: '時間（分）'

                    },
                    ticks: {  // タイトル文字色
                    },
                    grid: {
                        color: 'lightgray' // 横軸グリッド線の色
                    }

                    
                },
                y: {
                    beginAtZero: true,
                    max: yMax,
                    // title: { display: true, text: 'ゴール数' },
                    ticks: { 
                        stepSize: 1 }
                }
            }
        }
    });
}

// 5分または15分刻みの棒グラフを作成する関数
function drawStackedGoalGraph(goalTimes, concededTimes, interval) {
    const ctxId = interval === 5 ? 'stackedGoalChart5Min' : 'stackedGoalChart15Min';
    const ctx = document.getElementById(ctxId).getContext('2d');
    ctx.canvas.style.backgroundColor = 'white';  // 棒グラフの背景を白に設定

    if (interval === 5 && barChart5Min) {
        barChart5Min.destroy();
    }
    if (interval === 15 && barChart15Min) {
        barChart15Min.destroy();
    }

    const numBuckets = Math.ceil(90 / interval);
    const goalBuckets = Array(numBuckets).fill(0);
    const concededBuckets = Array(numBuckets).fill(0);

    
    goalTimes.forEach(time => {
        const bucketIndex = Math.min(Math.floor(time / interval), numBuckets - 1);
        goalBuckets[bucketIndex]++;
    });

    concededTimes.forEach(time => {
        const bucketIndex = Math.min(Math.floor(time / interval), numBuckets - 1);
        concededBuckets[bucketIndex]++;
    });

    const labels = Array.from({ length: numBuckets }, (_, i) => `${(i + 1) * interval}`);
    // const labels = Array.from({ length: numBuckets }, (_, i) => `~${(i + 1) * interval}分`);

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '得点',
                    data: goalBuckets,
                    backgroundColor: '#32CD32',
                    stack: 'stacked',
                },
                {
                    label: '失点',
                    data: concededBuckets.map(val => -val),
                    backgroundColor: '#FF0000',
                    stack: 'stacked',
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `${interval}分刻みの得点と失点の分布`,
                    color: 'rgb(0, 0, 0)', // タイトル文字色
                    font: { size: 20 }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: { display: true, text: '時間帯（分）' },
                    ticks: { font: { size: 8 } } // X軸目盛りのフォントサイズ
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    // title: { display: true, text: 'ゴール数' },
                    ticks: { stepSize: 1 },
                    // ticks: { font: { size: 10 } } // X軸目盛りのフォントサイズ
                }
            }
        }
    });

    if (interval === 5) {
        barChart5Min = chart;
    } else {
        barChart15Min = chart;
    }
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