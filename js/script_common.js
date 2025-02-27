// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// // ヘッダー・navi・フッター
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
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
                <input type="text" id="team${i + 1}" name="team${i + 1}" value="${team.teams}" class="team-name-input" readonly>
                <input type="text" id="teamSub${i + 1}" name="teamSub${i + 1}" value="${team.teamsSub}" class="team-subname-input" readonly><br>
            </div>
        `;
        teamContainer.insertAdjacentHTML('beforeend', teamItem);
    }

    // **シーズンリストを作成**
    populateSeasonDropdown();

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

// シーズン変更時の処理
function changeSeason() {
    let seasonSelect = document.getElementById('seasonSelect');
    window.currentSeason = seasonSelect.value; // グローバル変数を更新

    // シーズン変更後に画面を更新する（必要に応じて関数を呼び出す）
    updateAllDisplayData();
}


// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// // ホームタブ
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
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

    return brightness > 200 ? "#606060" : "#FFFFFF"; // 明るい色なら黒、暗い色なら白
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
        document.documentElement.style.setProperty('--teamhead-color-1', `${textColor}`);

        // タブのタイトルにチーム名を設定
        const teamHeader = document.getElementById('teamNameHeader');
        teamHeader.textContent = teamName;
        teamHeader.setAttribute('data-team-id', teamIndex);

        // 初回に現在の月のスケジュールを表示
        // currentMonthOffset = 0;
        // チーム日程を表示
        displayTeamMonthlySchedule(teamIndex);
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
function displayTeamMonthlySchedule(teamId) {
    let scheduleHTML = '';

    let displayMonth = new Date();
    displayMonth.setDate(1);
    displayMonth.setMonth(displayMonth.getMonth() + currentMonthOffset);
    const displayYear = displayMonth.getFullYear();
    const displayMonthIndex = displayMonth.getMonth();

    // **表示する試合データを決定**
    let targetSeasons = (displaySeason === "all") ? Object.keys(matchDataL) : [currentSeason];

    targetSeasons.forEach(season => {
        if (!matchDataL[season]) return; // データがないシーズンはスキップ

        let startDate = new Date(matchDataL[season].newDate || "2024-10-13"); // デフォルト日程

        let roundDates = {};
        let rounds = 0;

        // まず試合データのキーからラウンド数を算出
        for (const matchKey in matchDataL[season]) {
            if (matchKey.startsWith("round")) {
                let roundNumber = parseInt(matchKey.match(/round(\d+)/)?.[1], 10);
                if (!isNaN(roundNumber)) {
                    rounds = Math.max(rounds, roundNumber);
                }
            }
        }

        // 各ラウンドの日付を設定
        for (let i = 0; i <= rounds; i++) {
            roundDates[`round${i}`] = new Date(startDate);
            roundDates[`round${i}`].setDate(startDate.getDate() + i * 7); // 各節1週間ごと
        }

        for (const matchKey in matchDataL[season]) {
            if (matchKey === "teamsNum" || matchKey === "currentStandings" || matchKey === "newDate") continue;

            let match = matchDataL[season][matchKey];

            if (!match) continue;

            let matchDate = match.date ? new Date(match.date) : roundDates[matchKey.split('-')[0]];

            if (matchDate.getFullYear() === displayYear && matchDate.getMonth() === displayMonthIndex) {
                const isHome = match.home.teamId === teamId;
                const isAway = match.away.teamId === teamId;

                if (isHome || isAway) {
                    let opponentTeam = teamsData.find(team => team.teamId === (isHome ? match.away.teamId : match.home.teamId));

                    let scoreClass = '';
                    if (isHome && match.home.score !== null && match.away.score !== null) {
                        if (match.home.score > match.away.score) {
                            scoreClass = 'highlight-green';
                        } else if (match.home.score < match.away.score) {
                            scoreClass = 'highlight-red';
                        }
                    } else if (isAway && match.home.score !== null && match.away.score !== null) {
                        if (match.away.score > match.home.score) {
                            scoreClass = 'highlight-green';
                        } else if (match.away.score < match.home.score) {
                            scoreClass = 'highlight-red';
                        }
                    }

                    scheduleHTML += `
                        <tr>
                            <td>${matchDate.getDate()}日</td>
                            <td>${season}</td>
                            <td>${isHome ? 'ホーム' : 'アウェイ'}</td>
                            <td>${opponentTeam ? opponentTeam.teams : '不明'}</td>
                            <td class="${scoreClass}">${match.home.score ?? '-'} - ${match.away.score ?? '-'}</td>
                        </tr>
                    `;
                }
            }
        }
    });

    if (scheduleHTML === '') {
        scheduleHTML = `<tr><td colspan="5">この月の試合はありません</td></tr>`;
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