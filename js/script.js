// チーム数を指定
let totalTeamNum = 12;

///////////////////////////////////////////////////////////////////////////////////////////////////
// ヘッダー・navi
//////////////////////////////////////////////////////////////////////////////////////////////////
// タブを切り替える関数
function openTab(evt, tabName) {
    let tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";  // すべてのタブのコンテンツを非表示にする
    }
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");  // 全てのナビリンクから 'active' クラスを削除
    }
    document.getElementById(tabName).style.display = "block";  // 指定されたタブのコンテンツを表示する
    evt.currentTarget.className += " active";  // クリックされたリンクに 'active' クラスを追加
}

// ナビのホバーについての関数
document.querySelectorAll('nav ul li a').forEach(link => {
    link.addEventListener('click', function() {
        // すべてのリンクから 'active' クラスを削除
        document.querySelectorAll('nav ul li a').forEach(link => link.classList.remove('active'));
        
        // クリックされたリンクに 'active' クラスを追加
        this.classList.add('active');
    });
});

// デフォルトでホームタブを表示
document.getElementById("home").style.display = "block";
///////////////////////////////////////////////////////////////////////////////////////////////////
// ホームタブ
///////////////////////////////////////////////////////////////////////////////////////////////////
// GitHubリポジトリからJSONデータを取得し、ローカルストレージに保存する関数
function fetchAndSaveJsonFromGitHub() {
    const url = './league_data.json'; // JSONファイルの相対パス
    fetch(url)
        .then(response => {
            console.log(response); // ここでレスポンスを確認
            if (!response.ok) {
                throw new Error('GitHubからデータを取得できませんでした');
            }
            return response.json();
        })
        .then(data => {
            // JSONデータからteamsとmatchDataをローカルストレージに保存
            if (data.teamsSub) {
                localStorage.setItem('teamsSub', JSON.stringify(data.teamsSub));
            }
            if (data.teams) {
                localStorage.setItem('teams', JSON.stringify(data.teams));
            }
            
            if (data.matchData) {
                localStorage.setItem('matchData', JSON.stringify(data.matchData));
            }
            if (data.previousStandings) {
                localStorage.setItem('previousStandings', JSON.stringify(data.previousStandings));
            }
            if (data.currentStandings) {
                localStorage.setItem('currentStandings', JSON.stringify(data.currentStandings));
            }
            if (data.teamsData) {
                localStorage.setItem('teamsData', JSON.stringify(data.teamsData));
            }
            console.log('JSONデータがローカルストレージに保存されました');

            // ページのデータを更新
            getTeams();
            displaySchedule();  // 日程を表示
            //showRound(0);       // ページロード時に最初のラウンドを表示
            updateStandingsTable();  // 順位表を表示
            updateRankChangeArrows() // 矢印も表示
            displayIndividualRecords();
            updateIndividualRecords();  // 必要な場合に個人戦績を更新

        })
        .catch(error => {
            console.error('エラーが発生しました:', error);
        });
}

// ローカルストレージをリセットしてからJSONデータを読み込む関数
function resetLocalStorageAndLoadJson() {
    // ローカルストレージのすべてのデータを削除
    localStorage.clear();
    
    // JSONデータをGitHubから再取得
    fetchAndSaveJsonFromGitHub();
}

// 保存したチーム名を取得する関数
function getTeams() {
    // teamsDataをローカルストレージから取得
    let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];

    // データが存在しない場合はデフォルトの値を設定
    for (let i = 1; i <= totalTeamNum; i++) {
        let teamData = teamsData[i - 1] || { teamId: i, teamName: `Team${i}`, teamSub: `Sub${i}` };

        // フォームにチーム名と略称を設定
        document.getElementById(`team${i}`).value = teamData.teams;
        document.getElementById(`teamSub${i}`).value = teamData.teamsSub;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const teamContainer = document.querySelector('.team-list');
    const teamLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, totalTeamNum);

    // チームロゴを動的に生成
    for (let i = 0; i < totalTeamNum; i++) {
        const teamLetter = teamLetters[i];
        const teamItem = `
            <div class="team-item">
                <button class="team-logo-button" data-team="${teamLetter}">
                    <ul>
                        <li>
                            <a href="javascript:void(0)" class="tablinks" onclick="openTabWithTeam(event, 'teamPerformanceTab', ${i})">
                                <img src="Pictures/Team${teamLetter}.jpg" alt="Team ${teamLetter}" class="team-logo">
                            </a>
                        </li>
                    </ul>
                </button>
                <input type="text" id="team${i + 1}" name="team${i + 1}" value="Team${teamLetter}" class="team-name-input" readonly>
                <input type="text" id="teamSub${i + 1}" name="teamSub${i + 1}" value="Sub${teamLetter}" class="team-subname-input" readonly><br> <!-- 三文字チーム名入力欄 -->
            </div>
        `;
        teamContainer.insertAdjacentHTML('beforeend', teamItem);
    }

    // ページ読み込み時にJSONデータを取得し、ローカルストレージに保存
    fetchAndSaveJsonFromGitHub();
    // 保存されたチーム名を取得
    getTeams();  

    // 初期化処理
    displaySchedule();  // 日程を表示
    //showRound(0);       // ページロード時に最初のラウンドを表示
    updateStandingsTable();  // 順位表を表示
    updateRankChangeArrows() // 矢印も
    displayIndividualRecords();
    updateIndividualRecords();  // 必要な場合に個人戦績を更新
    
});

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// チームスタッツ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// チームスタッツを開く関数
function openTabWithTeam(evt, tabName, teamIndex) {
    // タブの切り替え
    openTab(evt, tabName);

    // ローカルストレージからチーム名を取得
    // let teams = JSON.parse(localStorage.getItem('teams')) || [];
    // ローカルストレージからteamsDataを取得
    let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];

    // クリックしたロゴに対応するチーム名を取得
    // const teamName = teams[teamIndex] || `Team ${teamIndex + 1}`;
    // const teamId = teamIndex + 1; // チームIDはインデックス + 1
    // クリックしたロゴに対応するチーム名を取得
    const team = teamsData.find(t => t.teamId === teamIndex);
    const teamName = team ? team.teams : `Team ${teamIndex + 1}`;

    // チーム名を戦績タブに表示
    document.getElementById('teamNameHeader').textContent = teamName;
    // チームIDを表示して確認（デバッグ用）
    console.log("Displaying stats for teamId:", teamIndex);
    // チーム戦績を計算して表示
    //calculateTeamStats(teamIndex); // ここでチーム戦績を計算する
    calculateTeamAndOpponentStats(teamIndex);
}




///////////////////////////////////////////////////////////////////////////////////////////////////
// チーム戦績タブに日程表を追加
///////////////////////////////////////////////////////////////////////////////////////////////////
let currentMonthOffset = 0; // 現在の月を基準としたオフセット

// チームごとの月ごとの試合を表示する関数
function displayTeamMonthlySchedule(teamId) {
    let matchData = JSON.parse(localStorage.getItem('matchData')) || {};
    let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];
    let scheduleHTML = '';

    // 現在の月を基準にして表示月を計算
    let displayMonth = new Date();
    displayMonth.setMonth(displayMonth.getMonth() + currentMonthOffset);
    const displayYear = displayMonth.getFullYear();
    const displayMonthIndex = displayMonth.getMonth();

    // 表示月と年に基づいて日程をフィルタリング
    for (const matchKey in matchData) {
        const match = matchData[matchKey];
        const matchDate = new Date(match.date);
        if (matchDate.getFullYear() === displayYear && matchDate.getMonth() === displayMonthIndex) {
            const isHome = match.home.teamId === teamId;
            const isAway = match.away.teamId === teamId;
            if (isHome || isAway) {
                let opponentTeam = teamsData.find(team => team.teamId === (isHome ? match.away.teamId : match.home.teamId));
                scheduleHTML += `
                    <tr>
                        <td>${matchDate.getDate()}${(match.home.score !== null && match.away.score !== null) ? '日' : '日まで'}</td>
                        <td>${isHome ? 'ホーム' : 'アウェイ'}</td>
                        <td>${opponentTeam ? opponentTeam.teams : '不明'}</td>
                        <td>${match.home.score ?? '-'} - ${match.away.score ?? '-'}</td>
                    </tr>
                `;
            }
        }
    }

    // 日程が存在しない場合のメッセージ
    if (scheduleHTML === '') {
        scheduleHTML = `<tr><td colspan="4">この月の試合はありません</td></tr>`;
    }

    document.getElementById('teamScheduleTableBody').innerHTML = scheduleHTML;
    document.getElementById('currentMonthLabel').textContent = `${displayYear}年${displayMonthIndex + 1}月`;
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

// タブを開くときにチームの日程表と戦績を表示
function openTabWithTeam(evt, tabName, teamIndex) {
    openTab(evt, tabName);
    let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];
    const team = teamsData.find(t => t.teamId === teamIndex);
    const teamName = team ? team.teams : `Team ${teamIndex + 1}`;

    document.getElementById('teamNameHeader').textContent = teamName;
    document.getElementById('teamNameHeader').setAttribute('data-team-id', teamIndex);

    // 初回に現在の月のスケジュールを表示
    currentMonthOffset = 0;
    displayTeamMonthlySchedule(teamIndex);
    //calculateTeamStats(teamIndex); // チーム戦績を表示
    calculateTeamAndOpponentStats(teamIndex);
}





// チームスタッツを閉じる関数
function closeTeamPerformanceTab() {
    document.getElementById('teamPerformanceTab').style.display = 'none';
    document.getElementById('home').style.display = 'block';
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
    const matchData = JSON.parse(localStorage.getItem('matchData')) || {};
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

    // 全試合のデータを集計
    for (const matchKey in matchData) {
        const match = matchData[matchKey];

        // スコアが未入力の試合を無視
        const homeScore = match.home.score;
        const awayScore = match.away.score;
        if (homeScore === null || awayScore === null) continue;

        overallStats.matches += 2; // 両チーム分カウント

        overallStats.goals += homeScore + awayScore;
        overallStats.possession += match.home.fullTime.possession + match.away.fullTime.possession;
        overallStats.shots += match.home.fullTime.shots + match.away.fullTime.shots;
        overallStats.shotsonFrame += match.home.fullTime.shotsonFrame + match.away.fullTime.shotsonFrame;
        overallStats.fouls += match.home.fullTime.fouls + match.away.fullTime.fouls;
        overallStats.offsides += match.home.fullTime.offsides + match.away.fullTime.offsides;
        overallStats.cornerKicks += match.home.fullTime.cornerKicks + match.away.fullTime.cornerKicks;
        overallStats.freeKicks += match.home.fullTime.freeKicks + match.away.fullTime.freeKicks;
        overallStats.passes += match.home.fullTime.passes + match.away.fullTime.passes;
        overallStats.successfulPasses += match.home.fullTime.successfulPasses + match.away.fullTime.successfulPasses;
        overallStats.crosses += match.home.fullTime.crosses + match.away.fullTime.crosses;
        overallStats.PassCuts += match.home.fullTime.PassCuts + match.away.fullTime.PassCuts;
        overallStats.successfulTackles += match.home.fullTime.successfulTackles + match.away.fullTime.successfulTackles;
        overallStats.save += match.home.fullTime.save + match.away.fullTime.save;

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
    return overallStats;
}

// 特定のチームの統計データを集計する関数
// function calculateTeamStats(teamId) {
//     const matchData = JSON.parse(localStorage.getItem('matchData')) || [];
//     let teamStats = {
//         matches: 0,
//         wins: 0,
//         goals: 0,
//         draws: 0,
//         losses: 0,
//         possession: 0,
//         shots: 0,
//         shotsonFrame: 0,
//         shotsonFrameRate: 0,
//         fouls: 0,
//         offsides: 0,
//         cornerKicks: 0,
//         freeKicks: 0,
//         passes: 0,
//         successfulPasses: 0,
//         passSuccessRate: 0,
//         crosses: 0,
//         PassCuts: 0,
//         successfulTackles: 0,
//         save: 0
//     };

//     let goalPlayers = {};
//     let assistPlayers = {};

//     for (const matchKey in matchData) {
//         const match = matchData[matchKey];
//         const isHome = match.home.teamId === teamId;
//         const isAway = match.away.teamId === teamId;

//         // スコアが未入力の試合を無視
//         const homeScore = match.home.score;
//         const awayScore = match.away.score;
//         if (homeScore === null || awayScore === null) continue;

//         if (isHome || isAway) {
//             teamStats.matches++;
//             teamStats.goals += isHome ? (homeScore || 0) : (awayScore || 0);
//             teamStats.possession += isHome ? (match.home.fullTime.possession || 0) : (match.away.fullTime.possession || 0);
//             teamStats.shots += isHome ? (match.home.fullTime.shots || 0) : (match.away.fullTime.shots || 0);
//             teamStats.shotsonFrame += isHome ? (match.home.fullTime.shotsonFrame || 0) : (match.away.fullTime.shotsonFrame || 0);
//             teamStats.fouls += isHome ? (match.home.fullTime.fouls || 0) : (match.away.fullTime.fouls || 0);
//             teamStats.offsides += isHome ? (match.home.fullTime.offsides || 0) : (match.away.fullTime.offsides || 0);
//             teamStats.cornerKicks += isHome ? (match.home.fullTime.cornerKicks || 0) : (match.away.fullTime.cornerKicks || 0);
//             teamStats.freeKicks += isHome ? (match.home.fullTime.freeKicks || 0) : (match.away.fullTime.freeKicks || 0);
//             teamStats.passes += isHome ? (match.home.fullTime.passes || 0) : (match.away.fullTime.passes || 0);
//             teamStats.successfulPasses += isHome ? (match.home.fullTime.successfulPasses || 0) : (match.away.fullTime.successfulPasses || 0);
//             teamStats.crosses += isHome ? (match.home.fullTime.crosses || 0) : (match.away.fullTime.crosses || 0);
//             teamStats.PassCuts += isHome ? (match.home.fullTime.PassCuts || 0) : (match.away.fullTime.PassCuts || 0);
//             teamStats.successfulTackles += isHome ? (match.home.fullTime.successfulTackles || 0) : (match.away.fullTime.successfulTackles || 0);
//             teamStats.save += isHome ? (match.home.fullTime.save || 0) : (match.away.fullTime.save || 0);

//             // goalPlayersArrayとassistPlayersArrayを適切に定義
//             const goalPlayersArray = isHome ? match.home.goalPlayers : match.away.goalPlayers;
//             const assistPlayersArray = isHome ? match.home.assistPlayers : match.away.assistPlayers;


//             if (Array.isArray(goalPlayersArray)) {
//                 goalPlayersArray.forEach(player => {
//                     if (player) {
//                         goalPlayers[player] = (goalPlayers[player] || 0) + 1;
//                     }
//                 });
//             }

//             if (Array.isArray(assistPlayersArray)) {
//                 assistPlayersArray.forEach(player => {
//                     if (player) {
//                         assistPlayers[player] = (assistPlayers[player] || 0) + 1;
//                     }
//                 });
//             }

//             if (isHome && homeScore > awayScore || isAway && awayScore > homeScore) {
//                 teamStats.wins++;
//             } else if (homeScore === awayScore) {
//                 teamStats.draws++;
//             } else {
//                 teamStats.losses++;
//             }
//         }
//     }

//     // 戦績データを表示
//     document.getElementById('matches-total').textContent = teamStats.matches;
//     document.getElementById('wins-total').textContent = teamStats.wins;
//     document.getElementById('goals-total').textContent = teamStats.goals;
//     document.getElementById('draws-total').textContent = teamStats.draws;
//     document.getElementById('losses-total').textContent = teamStats.losses;
//     document.getElementById('possession-total').textContent = "-";
//     document.getElementById('shots-total').textContent = teamStats.shots;
//     document.getElementById('shotsonFrame-total').textContent = teamStats.shotsonFrame;
//     document.getElementById('shotsonFrameRate-total').textContent = "-";
//     document.getElementById('fouls-total').textContent = teamStats.fouls;
//     document.getElementById('offsides-total').textContent = teamStats.offsides;
//     document.getElementById('cornerKicks-total').textContent = teamStats.cornerKicks;
//     document.getElementById('freeKicks-total').textContent = teamStats.freeKicks;
//     document.getElementById('passes-total').textContent = teamStats.passes;
//     document.getElementById('successfulPasses-total').textContent = teamStats.successfulPasses;
//     document.getElementById('passSuccessRate-total').textContent = "-";
//     document.getElementById('crosses-total').textContent = teamStats.crosses;
//     document.getElementById('PassCuts-total').textContent = teamStats.PassCuts;
//     document.getElementById('successfulTackles-total').textContent = teamStats.successfulTackles;
//     document.getElementById('saves-total').textContent = teamStats.save;

//     // 各種平均の計算と表示
//     document.getElementById('matches-avg').textContent = "-";
//     document.getElementById('wins-avg').textContent = (teamStats.wins*100 / teamStats.matches).toFixed(2) + '%';
//     document.getElementById('goals-avg').textContent = (teamStats.goals / teamStats.matches).toFixed(2);
//     document.getElementById('draws-avg').textContent = (teamStats.draws*100 / teamStats.matches).toFixed(2) + '%';
//     document.getElementById('losses-avg').textContent = (teamStats.losses*100 / teamStats.matches).toFixed(2) + '%';
//     document.getElementById('possession-avg').textContent = (teamStats.possession / teamStats.matches).toFixed(2) + '%';
//     document.getElementById('shots-avg').textContent = (teamStats.shots / teamStats.matches).toFixed(2);
//     document.getElementById('shotsonFrame-avg').textContent = (teamStats.shotsonFrame / teamStats.matches).toFixed(2);
//     document.getElementById('shotsonFrameRate-avg').textContent = (teamStats.shotsonFrame*100 / teamStats.shots).toFixed(2) + '%';
//     document.getElementById('fouls-avg').textContent = (teamStats.fouls / teamStats.matches).toFixed(2);
//     document.getElementById('offsides-avg').textContent = (teamStats.offsides / teamStats.matches).toFixed(2);
//     document.getElementById('cornerKicks-avg').textContent = (teamStats.cornerKicks / teamStats.matches).toFixed(2);
//     document.getElementById('freeKicks-avg').textContent = (teamStats.freeKicks / teamStats.matches).toFixed(2);
//     document.getElementById('passes-avg').textContent = (teamStats.passes / teamStats.matches).toFixed(2);
//     document.getElementById('successfulPasses-avg').textContent = (teamStats.successfulPasses / teamStats.matches).toFixed(2);
//     document.getElementById('passSuccessRate-avg').textContent = (teamStats.successfulPasses*100 / teamStats.passes).toFixed(2) + '%';
//     document.getElementById('crosses-avg').textContent = (teamStats.crosses / teamStats.matches).toFixed(2);
//     document.getElementById('PassCuts-avg').textContent = (teamStats.PassCuts / teamStats.matches).toFixed(2);
//     document.getElementById('successfulTackles-avg').textContent = (teamStats.successfulTackles / teamStats.matches).toFixed(2);
//     document.getElementById('saves-avg').textContent = (teamStats.save / teamStats.matches).toFixed(2);
//     // 全体平均（TL平均）の計算
//     const overallStats = calculateOverallTeamStats();
//     document.getElementById('matches-tl-avg').textContent = overallStats.matches;
//     document.getElementById('wins-tl-avg').textContent = (overallStats.wins*100 / overallStats.matches).toFixed(2) + '%';
//     document.getElementById('goals-tl-avg').textContent = (overallStats.goals / overallStats.matches).toFixed(2);
//     document.getElementById('draws-tl-avg').textContent = (overallStats.draws*100 / overallStats.matches).toFixed(2) + '%';
//     document.getElementById('losses-tl-avg').textContent = (overallStats.losses*100 / overallStats.matches).toFixed(2) + '%';
//     document.getElementById('possession-tl-avg').textContent = (overallStats.possession / overallStats.matches).toFixed(2) + '%';
//     document.getElementById('shots-tl-avg').textContent = (overallStats.shots / overallStats.matches).toFixed(2);
//     document.getElementById('shotsonFrame-tl-avg').textContent = (overallStats.shotsonFrame / overallStats.matches).toFixed(2);
//     document.getElementById('shotsonFrameRate-tl-avg').textContent = (overallStats.shotsonFrame*100 / overallStats.shots).toFixed(2) + '%';
//     document.getElementById('fouls-tl-avg').textContent = (overallStats.fouls / overallStats.matches).toFixed(2);
//     document.getElementById('offsides-tl-avg').textContent = (overallStats.offsides / overallStats.matches).toFixed(2);
//     document.getElementById('cornerKicks-tl-avg').textContent = (overallStats.cornerKicks / overallStats.matches).toFixed(2);
//     document.getElementById('freeKicks-tl-avg').textContent = (overallStats.freeKicks / overallStats.matches).toFixed(2);
//     document.getElementById('passes-tl-avg').textContent = (overallStats.passes / overallStats.matches).toFixed(2);
//     document.getElementById('successfulPasses-tl-avg').textContent = (overallStats.successfulPasses / overallStats.matches).toFixed(2);
//     document.getElementById('passSuccessRate-tl-avg').textContent = (overallStats.successfulPasses*100 / overallStats.passes).toFixed(2) + '%';
//     document.getElementById('crosses-tl-avg').textContent = (overallStats.crosses / overallStats.matches).toFixed(2);
//     document.getElementById('PassCuts-tl-avg').textContent = (overallStats.PassCuts / overallStats.matches).toFixed(2);
//     document.getElementById('successfulTackles-tl-avg').textContent = (overallStats.successfulTackles / overallStats.matches).toFixed(2);
//     document.getElementById('saves-tl-avg').textContent = (overallStats.save / overallStats.matches).toFixed(2);

//     // ゴールとアシストランキングの表示（新しく作った関数を使用）
//     displayTeamPlayerRanking('teamGoalPlayersTable', goalPlayers);  // チームゴールランキング
//     displayTeamPlayerRanking('teamAssistPlayersTable', assistPlayers);  // チームアシストランキング
//     // チームのゴール・失点グラフを描画
//     drawGoalGraph(teamId);

// }

// 特定のチームの統計データを集計する関数
function calculateTeamAndOpponentStats(teamId) {
    const matchData = JSON.parse(localStorage.getItem('matchData')) || [];
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

    for (const matchKey in matchData) {
        const match = matchData[matchKey];
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





let lineChart = null;  // 折れ線グラフ用の変数
let barChart5Min = null;   // 5分間隔の棒グラフ用の変数
let barChart15Min = null;   // 15分間隔の棒グラフ用の変数

// ゴールと失点のグラフを描画する関数
function drawGoalGraph(teamId) {
    const matchData = JSON.parse(localStorage.getItem('matchData')) || [];
    let goalTimes = [];
    let concededTimes = [];

    for (const matchKey in matchData) {
        const match = matchData[matchKey];
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
                    color: 'rgb(0, 0, 132)', // タイトル文字色
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
                    color: 'rgb(0, 0, 132)', // タイトル文字色
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
// 日程タブ
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

// 現在の日付に基づいて表示すべきラウンドを計算する関数
function calculateCurrentRound(startDate, scheduleLength) {
    const today = new Date();
    const dayDifference = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const weekDifference = Math.floor(dayDifference / 7);

    // 0 以上 scheduleLength - 1 以下の範囲に制限
    return Math.max(0, Math.min(weekDifference, scheduleLength - 1));
}

// 日程表を表示する関数
function displaySchedule(schedule = null) {
    let matchData = JSON.parse(localStorage.getItem('matchData')) || {};
    let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];

    // 保存されたスケジュールを取得
    if (!schedule) {
        schedule = [];
        let numRounds = Object.keys(matchData).length / (teamsData.length / 2); // ラウンド数を計算
        for (let round = 0; round < numRounds; round++) {
            let roundMatches = [];
            for (let match = 0; match < teamsData.length / 2; match++) {
                let matchKey = `round${round}-match${match}`;
                let homeTeam = teamsData.find(team => team.teamId === matchData[matchKey].home.teamId); 
                let awayTeam = teamsData.find(team => team.teamId === matchData[matchKey].away.teamId);
                // 日付を取得（既に保存されている場合のみ）
                let matchDate = matchData[matchKey]?.date;  // 日付を取得
                roundMatches.push({ 
                    home: getTeamNameByScreenSize(homeTeam), 
                    away: getTeamNameByScreenSize(awayTeam),
                    date: matchDate  // 日付を追加
                    //,date: getTeamNameByScreenSize(matchDate)
                });
            }
            schedule.push(roundMatches);
        }
    }

    let scheduleHTML = '';
    const startDate = new Date(2024, 9, 8); // スタート日付

    for (let i = 0; i < schedule.length; i++) {
        let weekDate = new Date(startDate);
        weekDate.setDate(startDate.getDate() + i * 7);
        let weekInfo = `第${i + 1}節 ${weekDate.getFullYear()}年${weekDate.getMonth() + 1}月第${Math.ceil(weekDate.getDate() / 7)}週`;

        scheduleHTML += `<div class="round" id="round${i}" style="display: none;">`;
        scheduleHTML +=  `
            <div class="schedule-header">
                <h3 class="week-info">${weekInfo}</h3>
                <div class="button-container">
                    <button class="button-common2" onclick="previousRound()">前節</button>
                    <button class="button-common2" onclick="nextRound()">次節</button>
                </div>
            </div>`;
        schedule[i].forEach((match, index) => {
            scheduleHTML += `
                <div class="match-container">
                    <table id="goalDetailsTable${i}-${index}" class="match-table">
                        <thead>
                            <tr>
                                <td colspan="5"><input type="date" id="matchDate${i}-${index}" value="${match.date || ''}"readonly></td>
                            </tr>
                            <tr>
                                <th id="homeTeam${i}-${index}">${match.home}</th>
                                <th> <input type="number" id="homeScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'home')"readonly></th>
                                <th> - </th>
                                <th id="awayTeam${i}-${index}"><input type="number" id="awayScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'away')"readonly></th>
                                <th> ${match.away}</th>
                            </tr>
                        </thead>
                        <tbody id="goalDetailsBody${i}-${index}"></tbody>
                    </table>`;

            const statsTableElement = generateStatsTable(i, index);
            scheduleHTML += statsTableElement.outerHTML;
            scheduleHTML += `</div>`;
        });
        scheduleHTML += `</div>`;
    }

    document.getElementById('scheduleContent').innerHTML = scheduleHTML;

    for (let roundIndex = 0; roundIndex < schedule.length; roundIndex++) {
        for (let matchIndex = 0; matchIndex < schedule[roundIndex].length; matchIndex++) {
            loadMatchData(roundIndex, matchIndex);
        }
    }

    // 日付に基づいて現在のラウンドを設定
    currentRound = calculateCurrentRound(startDate, schedule.length);
    showRound(currentRound);
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

// スタッツ表を作成する関数
function createStatsTable(statCategories, roundIndex, matchIndex) {
    const table = document.createElement('table');
    table.classList.add('stats-table'); // スタイルクラスを追加

    // 1行目に「ハーフタイム」「フルタイム」「空白」「ハーフタイム」「フルタイム」ヘッダを追加
    const headerRow = document.createElement('tr');

    const homeHalfHeader = document.createElement('th');
    homeHalfHeader.textContent = "ハーフタイム";
    
    const homeFullHeader = document.createElement('th');
    homeFullHeader.textContent = "フルタイム";

    const spacerHeader = document.createElement('th');
    spacerHeader.textContent = ""; // 空白のセル

    const awayHalfHeader = document.createElement('th');
    awayHalfHeader.textContent = "ハーフタイム";
    
    const awayFullHeader = document.createElement('th');
    awayFullHeader.textContent = "フルタイム";

    headerRow.appendChild(homeHalfHeader);
    headerRow.appendChild(homeFullHeader);
    headerRow.appendChild(spacerHeader);
    headerRow.appendChild(awayHalfHeader);
    headerRow.appendChild(awayFullHeader);

    table.appendChild(headerRow);

    // 2行目以降にスタッツ行を追加
    statCategories.forEach((category, index) => {
        const row = document.createElement('tr');

        // ホームチームのハーフタイム入力欄
        const homeHalfInput = document.createElement('input');
        homeHalfInput.type = "number";
        homeHalfInput.id = `homeHalfStat${index}-${roundIndex}-${matchIndex}`;
        homeHalfInput.placeholder = "0";
        homeHalfInput.min = (index === 0) ? "0" : "0";  // 支配率なら0～100に制限
        homeHalfInput.max = (index === 0) ? "100" : "";
        homeHalfInput.readOnly = true;  // readonlyを追加

        // ホームチームのフルタイム入力欄
        const homeFullInput = document.createElement('input');
        homeFullInput.type = "number";
        homeFullInput.id = `homeFullStat${index}-${roundIndex}-${matchIndex}`;
        homeFullInput.placeholder = "0";
        homeFullInput.min = (index === 0) ? "0" : "0";
        homeFullInput.max = (index === 0) ? "100" : "";
        homeFullInput.readOnly = true;  // readonlyを追加

        // 真ん中列（データの説明）
        const categoryCell = document.createElement('td');
        categoryCell.textContent = category;

        // アウェーチームのハーフタイム入力欄
        const awayHalfInput = document.createElement('input');
        awayHalfInput.type = "number";
        awayHalfInput.id = `awayHalfStat${index}-${roundIndex}-${matchIndex}`;
        awayHalfInput.placeholder = "0";
        awayHalfInput.min = (index === 0) ? "0" : "0";
        awayHalfInput.max = (index === 0) ? "100" : "";
        awayHalfInput.readOnly = true;  // readonlyを追加

        // アウェーチームのフルタイム入力欄
        const awayFullInput = document.createElement('input');
        awayFullInput.type = "number";
        awayFullInput.id = `awayFullStat${index}-${roundIndex}-${matchIndex}`;
        awayFullInput.placeholder = "0";
        awayFullInput.min = (index === 0) ? "0" : "0";
        awayFullInput.max = (index === 0) ? "100" : "";
        awayFullInput.readOnly = true;  // readonlyを追加

        // 行にセルを追加
        const homeHalfCell = document.createElement('td');
        homeHalfCell.appendChild(homeHalfInput);
        
        const homeFullCell = document.createElement('td');
        homeFullCell.appendChild(homeFullInput);
        
        const awayHalfCell = document.createElement('td');
        awayHalfCell.appendChild(awayHalfInput);
        
        const awayFullCell = document.createElement('td');
        awayFullCell.appendChild(awayFullInput);

        row.appendChild(homeHalfCell);
        row.appendChild(homeFullCell);
        row.appendChild(categoryCell);
        row.appendChild(awayHalfCell);
        row.appendChild(awayFullCell);

        table.appendChild(row);
    });

    return table;
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
                            アシスト：<input type="text" class="assist-player home" value="${assist}" readonly>
                            ゴール　：<input type="text" class="goal-player home" value="${goal}" readonly>
                        ` : `<span></span>`}
                    </td>
                    <td>
                        <input type="number" class="goal-time ${teamType}" value="${time}" min="0" step="1" onchange="sortGoalDetails(${roundIndex}, ${matchIndex})" readonly> 分
                    </td>

                    <td colspan="2">
                        ${teamType === 'away' ? `
                            アシスト：<input type="text" class="assist-player away" value="${assist}" readonly>
                            ゴール　：<input type="text" class="goal-player away" value="${goal}" readonly>
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

// 日程表データの自動読み込みをする関数
function loadMatchData(roundIndex, matchIndex) {
    let matchData = JSON.parse(localStorage.getItem('matchData')) || {};
    let matchKey = `round${roundIndex}-match${matchIndex}`;

    if (matchData[matchKey]) {
        let match = matchData[matchKey];
        // スコアを表示
        document.getElementById(`homeScore${roundIndex}-${matchIndex}`).value = match.home.score !== null ? match.home.score : '';
        document.getElementById(`awayScore${roundIndex}-${matchIndex}`).value = match.away.score !== null ? match.away.score : '';

        // スタッツデータを表示（ハーフタイムとフルタイム）
        const statCategories = ["possession", "shots", "shotsonFrame", "fouls", "offsides", "cornerKicks", "freeKicks", "passes", "successfulPasses", "crosses", "PassCuts", "successfulTackles", "save"];

        statCategories.forEach((category, index) => {
            document.getElementById(`homeHalfStat${index}-${roundIndex}-${matchIndex}`).value = match.home.halfTime[category] !== null ? match.home.halfTime[category] : '';
            document.getElementById(`homeFullStat${index}-${roundIndex}-${matchIndex}`).value = match.home.fullTime[category] !== null ? match.home.fullTime[category] : '';
            document.getElementById(`awayHalfStat${index}-${roundIndex}-${matchIndex}`).value = match.away.halfTime[category] !== null ? match.away.halfTime[category] : '';
            document.getElementById(`awayFullStat${index}-${roundIndex}-${matchIndex}`).value = match.away.fullTime[category] !== null ? match.away.fullTime[category] : '';
        });
        // スコアに基づいて得点詳細行を表示
        updateGoalDetails(roundIndex, matchIndex, 'home', match.home);
        updateGoalDetails(roundIndex, matchIndex, 'away', match.away);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// 順位表タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
// 順位を決める関数
function calculateStandings() {
    let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];
    let matchData = JSON.parse(localStorage.getItem('matchData')) || {};

    let standings = teamsData.map(team => {
        return {
            teamId: team.teamId,
            points: 0,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalDifference: 0,
            totalGoals: 0,
            currentRank: null
        };
    });

    // スコアが入力されている試合の結果を元に順位計算
    for (const matchKey in matchData) {
        let match = matchData[matchKey];
        let homeScore = match.home.score;
        let awayScore = match.away.score;

        if (homeScore === null || awayScore === null) continue; // スコアが未入力ならスキップ

        let homeTeam = standings.find(t => t.teamId === match.home.teamId);
        let awayTeam = standings.find(t => t.teamId === match.away.teamId);

        if (homeTeam && awayTeam) {
            if (homeScore > awayScore) {
                homeTeam.wins++;
                homeTeam.points += 3;
                awayTeam.losses++;
            } else if (homeScore < awayScore) {
                awayTeam.wins++;
                awayTeam.points += 3;
                homeTeam.losses++;
            } else {
                homeTeam.draws++;
                awayTeam.draws++;
                homeTeam.points++;
                awayTeam.points++;
            }

            homeTeam.matchesPlayed++;
            awayTeam.matchesPlayed++;
            homeTeam.totalGoals += homeScore;
            awayTeam.totalGoals += awayScore;
            homeTeam.goalDifference += (homeScore - awayScore);
            awayTeam.goalDifference += (awayScore - homeScore);
        }
    }

    // ランキングの計算
    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.totalGoals - a.totalGoals;
    });

    standings.forEach((standing, index) => {
        standing.currentRank = index + 1; // チームの順位を設定
    });

    return standings;
}

// 順位表を更新する関数
function updateStandingsTable() {
    let standings = calculateStandings();
    let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];

    let tbody = document.querySelector('#standingsTable tbody');
    tbody.innerHTML = ''; // 順位表を初期化

    standings.forEach(team => {
        let teamInfo = teamsData.find(t => t.teamId === team.teamId);
        let teamName = getTeamNameByScreenSize(teamInfo); // 画面幅に応じたチーム名
        
        let row = `
            <tr>
                <td>${team.currentRank}</td>
                <td>${teamName}</td>
                <td>${team.points}</td>
                <td>${team.matchesPlayed}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalDifference}</td>
                <td>${team.totalGoals}</td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// 順位変動の保存
function saveStandingsData(standings) {
    let currentStandings = standings.map(team => ({
        Rank: team.currentRank,
        teamId: team.teamId // TeamIdを保存
    }));

    // 現在の順位を previousStandings に移動
    let previousStandings = JSON.parse(localStorage.getItem('currentStandings')) || [];
    localStorage.setItem('previousStandings', JSON.stringify(previousStandings));

    // 現在の順位のみを保存
    localStorage.setItem('currentStandings', JSON.stringify(currentStandings));
}

// 順位変動の矢印を表示する関数
function updateRankChangeArrows() {
    let currentStandings = JSON.parse(localStorage.getItem('currentStandings')) || [];
    let standings = calculateStandings(); // 現在の順位を再計算
    let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];

    let tbody = document.querySelector('#standingsTable tbody');
    tbody.innerHTML = ''; // 順位表を初期化

    standings.forEach(team => {
        let currentTeam = currentStandings.find(t => t.teamId === team.teamId);

        let previousRank = currentTeam ? currentTeam.Rank : null;
        let currentRank = team.currentRank;

        let rankChange = '';
        let rankClass = '';

        // previousRank と currentRank を比較して順位の変動をチェック
        if (previousRank !== null) {
            if (currentRank < previousRank) {
                rankChange = '▲'; // 順位上昇
                rankClass = 'rank-up';
            } else if (currentRank > previousRank) {
                rankChange = '▼'; // 順位下降
                rankClass = 'rank-down';
            } else {
                rankChange = '---'; // 順位変動なし
                rankClass = 'rank-no-change';
            }
        } else {
            rankChange = '-';
            rankClass = 'rank-no-change';
        }

        let teamInfo = teamsData.find(t => t.teamId === team.teamId);
        let teamName = getTeamNameByScreenSize(teamInfo); // 画面幅に応じたチーム名

        let row = `
            <tr>
                <td>${team.currentRank} <span class="${rankClass}">${rankChange}</span></td>
                <td>${teamName}</td>
                <td>${team.points}</td>
                <td>${team.matchesPlayed}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalDifference}</td>
                <td>${team.totalGoals}</td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });

}


// 今節のデータ入力完了時に順位変動を保存し、矢印を表示する関数
function completeRound(roundIndex) {
    let standings = calculateStandings();

    // standingsから簡略化したデータを保存
    saveStandingsData(standings);

    // 順位表を更新
    updateRankChangeArrows();

    alert(`第${roundIndex + 1}節のデータが確定しました。順位表を更新しました。`);
}

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 個人戦績タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
function displayIndividualRecords() {
    let individualRecords = JSON.parse(localStorage.getItem('individualRecords')) || { assists: {}, goals: {} };

    // アシストのランキングを表示
    let assistsTable = document.getElementById('assistPlayersTable');
    let goalsTable = document.getElementById('goalPlayersTable');

    // テーブルをクリア
    assistsTable.querySelector('tbody').innerHTML = '';
    goalsTable.querySelector('tbody').innerHTML = '';

    // アシストランキング
    let assistsSorted = Object.entries(individualRecords.assists).sort((a, b) => b[1] - a[1]);
    assistsSorted.forEach(([player, count], index) => {
        let row = `<tr><td>${index + 1}</td><td>${player}</td><td>${count}</td></tr>`;
        assistsTable.querySelector('tbody').insertAdjacentHTML('beforeend', row);
    });

    // ゴールランキング
    let goalsSorted = Object.entries(individualRecords.goals).sort((a, b) => b[1] - a[1]);
    goalsSorted.forEach(([player, count], index) => {
        let row = `<tr><td>${index + 1}</td><td>${player}</td><td>${count}</td></tr>`;
        goalsTable.querySelector('tbody').insertAdjacentHTML('beforeend', row);
    });
}

function updateIndividualRecords() {
    let matchData = JSON.parse(localStorage.getItem('matchData')) || {};

    let goalPlayers = {};
    let assistPlayers = {};

    // 各試合のデータを集計
    Object.values(matchData).forEach(match => {
        // ホームチームのゴールとアシストをカウント
        if (match.home && Array.isArray(match.home.goalPlayers)) {
            match.home.goalPlayers.forEach(player => {
                if (player) {
                    goalPlayers[player] = (goalPlayers[player] || 0) + 1;
                }
            });
        }
        if (match.home && Array.isArray(match.home.assistPlayers)) {
            match.home.assistPlayers.forEach(player => {
                if (player) {
                    assistPlayers[player] = (assistPlayers[player] || 0) + 1;
                }
            });
        }

        // アウェイチームのゴールとアシストをカウント
        if (match.away && Array.isArray(match.away.goalPlayers)) {
            match.away.goalPlayers.forEach(player => {
                if (player) {
                    goalPlayers[player] = (goalPlayers[player] || 0) + 1;
                }
            });
        }
        if (match.away && Array.isArray(match.away.assistPlayers)) {
            match.away.assistPlayers.forEach(player => {
                if (player) {
                    assistPlayers[player] = (assistPlayers[player] || 0) + 1;
                }
            });
        }
    });

    // ゴールランキングの表示
    displayPlayerRanking('goalPlayersTable', goalPlayers);

    // アシストランキングの表示
    displayPlayerRanking('assistPlayersTable', assistPlayers);
}

// ランキング表示用の関数
// ランキング表示用の関数
function displayPlayerRanking(tableId, players) {
    let sortedPlayers = Object.entries(players).sort((a, b) => b[1] - a[1]); // 得点順にソート
    let tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';  // テーブルを初期化

    let rank = 1;  // 順位
    let prevScore = null;  // 前のスコア
    let displayRank = rank; // 表示する順位

    sortedPlayers.forEach(([player, count], index) => {
        // 前のスコアと異なる場合は順位を更新
        if (prevScore !== count) {
            displayRank = rank;  // 表示する順位を更新
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
