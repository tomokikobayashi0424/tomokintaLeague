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


// ナビのホバーについて
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
// チーム名を取得してローカルストレージに保存する関数
function saveTeams() {
    let teams = [];
    let teamsSub = [];
    for (let i = 1; i <= totalTeamNum; i++) {
        // チーム名を取得し、前後の空白を削除してから保存
        let teamName = document.getElementById(`team${i}`).value.trim();
        teams.push(teamName);
        // 三文字チーム名を取得し、前後の空白を削除してから保存
        let teamSubName = document.getElementById(`teamSub${i}`).value.trim();
        teamsSub.push(teamSubName);
    }
    // チーム名をローカルストレージに保存
    localStorage.setItem('teams', JSON.stringify(teams));
    localStorage.setItem('teamsSub', JSON.stringify(teamsSub));
    alert("チーム名と3文字略称が保存されました！");
    // チーム名を更新した後、日程と順位表を再生成
    displaySchedule();
    updateStandingsTable();
}

// 保存したチーム名を取得する関数
function getTeams() {
    let teams = JSON.parse(localStorage.getItem('teams')) || [];
    let teamsSub = JSON.parse(localStorage.getItem('teamsSub')) || [];
    for (let i = 1; i <= totalTeamNum; i++) {
        document.getElementById(`team${i}`).value = teams[i - 1] || `Team${i}`;
        document.getElementById(`teamSub${i}`).value = teamsSub[i - 1] || `Sub${i}`; // 三文字チーム名
    }
}


// ローカルストレージの内容をJSONファイルにしてダウンロードする関数
function downloadLocalStorageAsJson() {
    // ローカルストレージから必要なデータを取得
    let teams = JSON.parse(localStorage.getItem('teams')) || [];
    let teamsSub = JSON.parse(localStorage.getItem('teamsSub')) || {};
    let matchData = JSON.parse(localStorage.getItem('matchData')) || {};
    let previousStandings = JSON.parse(localStorage.getItem('previousStandings')) || {};
    let currentStandings = JSON.parse(localStorage.getItem('currentStandings')) || {};

    // 保存するデータをオブジェクトにまとめる
    let dataToSave = {
        teams: teams,
        teamsSub: teamsSub,
        matchData: matchData,
        previousStandings: previousStandings,
        currentStandings: currentStandings
    };

    // JSON文字列に変換
    let jsonStr = JSON.stringify(dataToSave, null, 2);

    // JSONファイルを作成してダウンロード
    let blob = new Blob([jsonStr], { type: 'application/json' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'league_data.json'; // ダウンロードするファイル名
    a.click();
    URL.revokeObjectURL(url); // メモリ解放
}

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
            console.log('JSONデータがローカルストレージに保存されました');

            // ページのデータを更新
            getTeams();
            displaySchedule();  // 日程を表示
            showRound(0);       // ページロード時に最初のラウンドを表示
            updateStandingsTable();  // 順位表を表示
            updateRankChangeArrows() // 矢印も表示
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
                <input type="text" id="team${i + 1}" name="team${i + 1}" value="Team${teamLetter}" class="team-name-input" readonly><br>
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
    showRound(0);       // ページロード時に最初のラウンドを表示
    updateStandingsTable();  // 順位表を表示
    updateRankChangeArrows() // 矢印も
    
});


///////////////////////////////////////////////////////////////////////////////////////////////////
// チームスタッツ
///////////////////////////////////////////////////////////////////////////////////////////////////
function openTabWithTeam(evt, tabName, teamIndex) {
    // タブの切り替え
    openTab(evt, tabName);

    // ローカルストレージからチーム名を取得
    let teams = JSON.parse(localStorage.getItem('teams')) || [];

    // クリックしたロゴに対応するチーム名を取得
    const teamName = teams[teamIndex] || `Team ${teamIndex + 1}`;
    const teamId = teamIndex + 1; // チームIDはインデックス + 1

    // チーム名を戦績タブに表示
    document.getElementById('teamNameHeader').textContent = teamName;
    // チーム戦績を計算して表示
    calculateTeamStats(teamId);  // ここでチーム戦績を計算する
}
function closeTeamPerformanceTab() {
    document.getElementById('teamPerformanceTab').style.display = 'none';
    document.getElementById('home').style.display = 'block';
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
        fouls: 0,
        offsides: 0,
        cornerKicks: 0,
        freeKicks: 0,
        passes: 0,
        successfulPasses: 0,
        crosses: 0,
        PassCuts: 0,
        successfulTackles: 0,
        save: 0
    };

    // 全試合のデータを集計
    for (const matchKey in matchData) {
        const match = matchData[matchKey];
        overallStats.matches += 2; // 両チーム分カウント

        overallStats.goals += match.home.score + match.away.score;
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

        if (match.home.score > match.away.score) {
            overallStats.wins++;
            overallStats.losses++;
        } else if (match.home.score === match.away.score) {
            overallStats.draws += 2;
        } else {
            overallStats.wins++;
            overallStats.losses++;
        }
    }

    // 平均を計算
    overallStats.possession = overallStats.possession / (2 * Object.keys(matchData).length);

    return overallStats;
}

// チーム戦績を計算して表を埋める関数
function calculateTeamStats(teamId) {
    const matchData = JSON.parse(localStorage.getItem('matchData')) || {};
    let teamStats = {
        matches: 0,
        wins: 0,
        goals: 0,
        draws: 0,
        losses: 0,
        possession: 0,
        shots: 0,
        shotsonFrame: 0,
        fouls: 0,
        offsides: 0,
        cornerKicks: 0,
        freeKicks: 0,
        passes: 0,
        successfulPasses: 0,
        crosses: 0,
        PassCuts: 0,
        successfulTackles: 0,
        save: 0
    };


    // matchDataからチームIDに対応する試合を集計
    for (const matchKey in matchData) {
        const match = matchData[matchKey];
        const isHome = match.home.teamId === teamId;
        const isAway = match.away.teamId === teamId;

        if (isHome || isAway) {
            teamStats.matches++;
            teamStats.goals += isHome ? (match.home.score || 0) : (match.away.score || 0);
            //ポゼッション
            teamStats.possession += isHome ? (match.home.fullTime.possession || 0) : (match.away.fullTime.possession || 0);
            teamStats.shots += isHome ? (match.home.fullTime.shots || 0) : (match.away.fullTime.shots || 0);
            teamStats.shotsonFrame += isHome ? (match.home.fullTime.shotsonFrame || 0) : (match.away.fullTime.shotsonFrame || 0);
            teamStats.fouls += isHome ? (match.home.fullTime.fouls || 0) : (match.away.fullTime.fouls || 0);
            teamStats.offsides += isHome ? (match.home.fullTime.offsides || 0) : (match.away.fullTime.offsides || 0);
            teamStats.cornerKicks += isHome ? (match.home.fullTime.cornerKicks || 0) : (match.away.fullTime.cornerKicks || 0);
            teamStats.freeKicks += isHome ? (match.home.fullTime.freeKicks || 0) : (match.away.fullTime.freeKicks || 0);
            teamStats.passes += isHome ? (match.home.fullTime.passes || 0) : (match.away.fullTime.passes || 0);
            teamStats.successfulPasses += isHome ? (match.home.fullTime.successfulPasses || 0) : (match.away.fullTime.successfulPasses || 0);
            teamStats.crosses += isHome ? (match.home.fullTime.crosses || 0) : (match.away.fullTime.crosses || 0);
            teamStats.PassCuts += isHome ? (match.home.fullTime.PassCuts || 0) : (match.away.fullTime.PassCuts || 0);
            teamStats.successfulTackles += isHome ? (match.home.fullTime.successfulTackles || 0) : (match.away.fullTime.successfulTackles || 0);
            teamStats.save += isHome ? (match.home.fullTime.save || 0) : (match.away.fullTime.save || 0);

            if (isHome && match.home.score > match.away.score || isAway && match.away.score > match.home.score) {
                teamStats.wins++;
            } else if (match.home.score === match.away.score) {
                teamStats.draws++;
            } else {
                teamStats.losses++;
            }
        }
    }

    // チームデータをHTMLに反映
    document.getElementById('matches-total').textContent = teamStats.matches;
    document.getElementById('wins-total').textContent = teamStats.wins;
    document.getElementById('goals-total').textContent = teamStats.goals;
    document.getElementById('draws-total').textContent = teamStats.draws;
    document.getElementById('losses-total').textContent = teamStats.losses;
    document.getElementById('possession-total').textContent = "-";
    document.getElementById('shots-total').textContent = teamStats.shots;
    document.getElementById('shotsonFrame-total').textContent = teamStats.shotsonFrame;
    document.getElementById('fouls-total').textContent = teamStats.fouls;
    document.getElementById('offsides-total').textContent = teamStats.offsides;
    document.getElementById('cornerKicks-total').textContent = teamStats.cornerKicks;
    document.getElementById('freeKicks-total').textContent = teamStats.freeKicks;
    document.getElementById('passes-total').textContent = teamStats.passes;
    document.getElementById('successfulPasses-total').textContent = teamStats.successfulPasses;
    document.getElementById('crosses-total').textContent = teamStats.crosses;
    document.getElementById('PassCuts-total').textContent = teamStats.PassCuts;
    document.getElementById('successfulTackles-total').textContent = teamStats.successfulTackles;
    document.getElementById('saves-total').textContent = teamStats.save;

    // // 各種平均の計算と表示
    document.getElementById('matches-avg').textContent = "-";
    document.getElementById('wins-avg').textContent = (teamStats.wins / teamStats.matches).toFixed(2);
    document.getElementById('goals-avg').textContent = (teamStats.goals / teamStats.matches).toFixed(2);
    document.getElementById('draws-avg').textContent = (teamStats.draws / teamStats.matches).toFixed(2);
    document.getElementById('losses-avg').textContent = (teamStats.losses / teamStats.matches).toFixed(2);
    document.getElementById('possession-avg').textContent = (teamStats.possession / teamStats.matches).toFixed(2);
    document.getElementById('shots-avg').textContent = (teamStats.shots / teamStats.matches).toFixed(2);
    document.getElementById('shotsonFrame-avg').textContent = (teamStats.shotsonFrame / teamStats.matches).toFixed(2);
    document.getElementById('fouls-avg').textContent = (teamStats.fouls / teamStats.matches).toFixed(2);
    document.getElementById('offsides-avg').textContent = (teamStats.offsides / teamStats.matches).toFixed(2);
    document.getElementById('cornerKicks-avg').textContent = (teamStats.cornerKicks / teamStats.matches).toFixed(2);
    document.getElementById('freeKicks-avg').textContent = (teamStats.freeKicks / teamStats.matches).toFixed(2);
    document.getElementById('passes-avg').textContent = (teamStats.passes / teamStats.matches).toFixed(2);
    document.getElementById('successfulPasses-avg').textContent = (teamStats.successfulPasses / teamStats.matches).toFixed(2);
    document.getElementById('crosses-avg').textContent = (teamStats.crosses / teamStats.matches).toFixed(2);
    document.getElementById('PassCuts-avg').textContent = (teamStats.PassCuts / teamStats.matches).toFixed(2);
    document.getElementById('successfulTackles-avg').textContent = (teamStats.successfulTackles / teamStats.matches).toFixed(2);
    document.getElementById('saves-avg').textContent = (teamStats.save / teamStats.matches).toFixed(2);
    // 全体平均（TL平均）の計算
    const overallStats = calculateOverallTeamStats();
    document.getElementById('matches-tl-avg').textContent = overallStats.matches;
    document.getElementById('wins-tl-avg').textContent = (overallStats.wins / overallStats.matches).toFixed(2);
    document.getElementById('goals-tl-avg').textContent = (overallStats.goals / overallStats.matches).toFixed(2);
    document.getElementById('draws-tl-avg').textContent = (overallStats.draws / overallStats.matches).toFixed(2);
    document.getElementById('losses-tl-avg').textContent = (overallStats.losses / overallStats.matches).toFixed(2);
    // document.getElementById('possession-total').textContent = teamStats.possession;
    document.getElementById('possession-tl-avg').textContent = (overallStats.possession / overallStats.matches).toFixed(2);
    document.getElementById('shots-tl-avg').textContent = (overallStats.shots / overallStats.matches).toFixed(2);
    document.getElementById('shotsonFrame-tl-avg').textContent = (overallStats.shotsonFrame / overallStats.matches).toFixed(2);
    document.getElementById('fouls-tl-avg').textContent = (overallStats.fouls / overallStats.matches).toFixed(2);
    document.getElementById('offsides-tl-avg').textContent = (overallStats.offsides / overallStats.matches).toFixed(2);
    document.getElementById('cornerKicks-tl-avg').textContent = (overallStats.cornerKicks / overallStats.matches).toFixed(2);
    document.getElementById('freeKicks-tl-avg').textContent = (overallStats.freeKicks / overallStats.matches).toFixed(2);
    document.getElementById('passes-tl-avg').textContent = (overallStats.passes / overallStats.matches).toFixed(2);
    document.getElementById('successfulPasses-tl-avg').textContent = (overallStats.successfulPasses / overallStats.matches).toFixed(2);
    document.getElementById('crosses-tl-avg').textContent = (overallStats.crosses / overallStats.matches).toFixed(2);
    document.getElementById('PassCuts-tl-avg').textContent = (overallStats.PassCuts / overallStats.matches).toFixed(2);
    document.getElementById('successfulTackles-tl-avg').textContent = (overallStats.successfulTackles / overallStats.matches).toFixed(2);
    document.getElementById('saves-tl-avg').textContent = (overallStats.save / overallStats.matches).toFixed(2);
}


///////////////////////////////////////////////////////////////////////////////////////////////////
// 日程タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
// 画面幅に応じてチーム配列を返す関数
function getResponsiveTeams() {
    if (window.innerWidth <= 600) {
        return JSON.parse(localStorage.getItem('teamsSub')) || [];
    } else {
        return JSON.parse(localStorage.getItem('teams')) || [];
    }
}

// 全チームの総当たり日程を生成する関数
function generateSchedule() {
    // 画面サイズに応じたチーム配列を取得
    let responsiveTeams = getResponsiveTeams();
    let schedule = [];
    let numTeams = responsiveTeams.length;
    let numRounds = numTeams - 1; // 各チームが他のすべてのチームと1回対戦
    let numMatchesPerRound = numTeams / 2;

    for (let round = 0; round < numRounds; round++) {
        let roundMatches = [];
        for (let match = 0; match < numMatchesPerRound; match++) {
            let home = (round + match) % (numTeams - 1);
            let away = (numTeams - 1 - match + round) % (numTeams - 1);

            if (match === 0) {
                away = numTeams - 1;
            }

            roundMatches.push({
                home: responsiveTeams[home],  // 画面幅に応じたチーム名を使用
                away: responsiveTeams[away]
            });
        }
        schedule.push(roundMatches);
    }

    // 2巡目を作成（ホームとアウェイを逆転）
    let secondHalf = schedule.map(roundMatches => roundMatches.map(match => ({
        home: match.away,
        away: match.home
    })));

    return schedule.concat(secondHalf); // 2巡分を連結して返す
}

// スケジュールを表示する関数（閲覧専用版）
function displaySchedule() {
    let teams = JSON.parse(localStorage.getItem('teams'));
    if (!teams) return;

    let schedule = generateSchedule(teams);
    let scheduleHTML = '';

    const startDate = new Date(2024, 9, 5); // 2024年9月第1週からスタート
    for (let i = 0; i < schedule.length; i++) {
        let weekDate = new Date(startDate);
        weekDate.setDate(startDate.getDate() + i * 7);
        let weekInfo = `第${i + 1}節 ${weekDate.getFullYear()}年${weekDate.getMonth() + 1}月第${Math.ceil(weekDate.getDate() / 7)}週`;

        scheduleHTML += `<div class="round" id="round${i}" style="display: none;">`;
        scheduleHTML +=  `
            <div class="schedule-header">
                <button class="button-common" onclick="previousRound()">前節</button>
                <h3 class="week-info">${weekInfo}</h3>
                <button class="button-common" onclick="nextRound()">次節</button>
            </div>`;
        schedule[i].forEach((match, index) => {
            scheduleHTML += `
                <div class="match-container">
                    <table id="goalDetailsTable${i}-${index}" class="match-table">
                        <thead>
                            <tr>
                                <th id="homeTeam${i}-${index}">${match.home} <input type="number" id="homeScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'home')"readonly></th>
                                <th> - </th>
                                <th id="awayTeam${i}-${index}"><input type="number" id="awayScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'away')"readonly> ${match.away}</th>
                            </tr>
                        </thead>
                        <tbody id="goalDetailsBody${i}-${index}"></tbody>
                    </table>`;
                    // スタッツ表をスコア入力完了ボタンの前に追加
                    const statsTableElement = generateStatsTable(i, index);
                    scheduleHTML += statsTableElement.outerHTML;
                    scheduleHTML += `
                </div>`;
        });
        scheduleHTML += `</div>`;
    }

    document.getElementById('scheduleContent').innerHTML = scheduleHTML;

    // 保存されているデータをロードして表示
    schedule.forEach((round, roundIndex) => {
        round.forEach((match, matchIndex) => {
            loadMatchData(roundIndex, matchIndex);  // 保存されたデータをロードして表示
        });
    });

    // 最初のラウンドを表示（ページロード時）
    showRound(currentRound || 0);  // 初期値が0のとき最初のラウンドを表示
}

let currentRound = 0;

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
        homeHalfInput.readOnly = true; // 読み取り専用に設定

        // ホームチームのフルタイム入力欄
        const homeFullInput = document.createElement('input');
        homeFullInput.type = "number";
        homeFullInput.id = `homeFullStat${index}-${roundIndex}-${matchIndex}`;
        homeFullInput.placeholder = "0";
        homeFullInput.min = (index === 0) ? "0" : "0";
        homeFullInput.max = (index === 0) ? "100" : "";
        homeFullInput.readOnly = true; // 読み取り専用に設定

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
        awayHalfInput.readOnly = true; // 読み取り専用に設定

        // アウェーチームのフルタイム入力欄
        const awayFullInput = document.createElement('input');
        awayFullInput.type = "number";
        awayFullInput.id = `awayFullStat${index}-${roundIndex}-${matchIndex}`;
        awayFullInput.placeholder = "0";
        awayFullInput.min = (index === 0) ? "0" : "0";
        awayFullInput.max = (index === 0) ? "100" : "";
        awayFullInput.readOnly = true; // 読み取り専用に設定

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
                    <td>
                        ${teamType === 'home' ? `
                            アシスト：<input type="text" class="assist-player home" value="${assist}"readonly>
                            ゴール　：<input type="text" class="goal-player home" value="${goal}"readonly>
                        ` : `<span></span>`}
                    </td>
                    <td>
                        <input type="number" class="goal-time ${teamType}" value="${time}" min="0" step="1" onchange="sortGoalDetails(${roundIndex}, ${matchIndex})"readonly> 分
                    </td>

                    <td>
                        ${teamType === 'away' ? `
                            アシスト：<input type="text" class="assist-player away" value="${assist}"readonly>
                            ゴール　：<input type="text" class="goal-player away" value="${goal}"readonly>
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

function getTeamIdByName(teamName) {
    let teams = JSON.parse(localStorage.getItem('teams')) || [];
    return teams.indexOf(teamName);  // チーム名に対応するIDを取得
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
    let responsiveTeams = getResponsiveTeams(); // 画面幅に応じたチーム配列を取得
    let previousStandings = JSON.parse(localStorage.getItem('previousStandings')) || {};

    let standings = responsiveTeams.map((index) => {
        //////
        //////
        //////
        //////ここのteamを消したらteam名が消えて、入れたままにすると計算されなくなる１１！！
        
        let lastRank = previousStandings[index] ? previousStandings[index].currentRank : null;

        return {
            teamId: index, // チームIDは0始まりに統一
            points: 0,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalDifference: 0,
            totalGoals: 0,
            lastRank: lastRank,
            currentRank: null
        };
    });

    // 日程の結果を取得して順位計算
    let schedule = generateSchedule(responsiveTeams);
    schedule.forEach((round, roundIndex) => {
        round.forEach((match, matchIndex) => {
            let homeScore = document.getElementById(`homeScore${roundIndex}-${matchIndex}`).value;
            let awayScore = document.getElementById(`awayScore${roundIndex}-${matchIndex}`).value;

            // スコアが未入力の場合は無視
            if (homeScore === "" || awayScore === "") return;

            homeScore = parseInt(homeScore);
            awayScore = parseInt(awayScore);

            let homeTeam = standings.find(t => t.teamId === match.home);
            let awayTeam = standings.find(t => t.teamId === match.away);

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
        });
    });

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


// 順位表を更新する関数（矢印なし）
function updateStandingsTable() {
    let standings = calculateStandings();
    let teams = getResponsiveTeams(); // 画面幅に応じたチーム配列を取得

    let tbody = document.querySelector('#standingsTable tbody');
    tbody.innerHTML = ''; // 順位表を初期化

    standings.forEach(team => {
        let teamName = (team.teamId >= 0 && team.teamId < teams.length) ? teams[team.teamId] : `${team.teamId}`;
        
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
    // standingsは詳細なデータを含んでいる可能性があるので、シンプルに変換
    let currentStandings = standings.map(team => ({
        Rank: team.currentRank,
        teamId: team.teamId // TeamIdを保存
    }));

    // 現在の順位を previousStandings に移動
    let previousStandings = JSON.parse(localStorage.getItem('currentStandings')) || [];
    localStorage.setItem('previousStandings', JSON.stringify(previousStandings));

    // 現在の順位のみを保存
    localStorage.setItem('currentStandings', JSON.stringify(currentStandings));

    // デバッグ用の確認
    console.log('Previous Standings: ', previousStandings);
    console.log('Current Standings: ', currentStandings);
}


// 順位変動の矢印を表示する関数
function updateRankChangeArrows() {
    let previousStandings = JSON.parse(localStorage.getItem('previousStandings')) || [];
    let currentStandings = JSON.parse(localStorage.getItem('currentStandings')) || [];
    let teams = getResponsiveTeams(); // 画面幅に応じたチーム配列を取得

    let tbody = document.querySelector('#standingsTable tbody');
    tbody.innerHTML = ''; // 順位表を初期化

    let standings = calculateStandings();

    standings.forEach(team => {
        let previousTeam = previousStandings.find(t => t.teamId === team.teamId);
        let currentTeam = currentStandings.find(t => t.teamId === team.teamId);

        let previousRank = previousTeam ? previousTeam.Rank : null;
        let currentRank = currentTeam ? currentTeam.Rank : team.currentRank;

        let rankChange = '';
        let rankClass = '';

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

        let teamName = (team.teamId >= 0 && team.teamId < teams.length) ? teams[team.teamId] : `${team.teamId}`;

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

    localStorage.setItem('currentStandings', JSON.stringify(currentStandings));
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

////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 個人戦績タブ
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

// ページロード時に個人戦績を表示
document.addEventListener('DOMContentLoaded', () => {
    displayIndividualRecords();
    updateIndividualRecords();  // 必要な場合に個人戦績を更新
});



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
function displayPlayerRanking(tableId, players) {
    let sortedPlayers = Object.entries(players).sort((a, b) => b[1] - a[1]); // 得点順にソート
    let tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';  // テーブルを初期化

    sortedPlayers.forEach(([player, count], index) => {
        let row = `
            <tr>
                <td>${index + 1}</td>
                <td>${player}</td>
                <td>${count}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}




///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////