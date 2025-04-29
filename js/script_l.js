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
// 各種データ表示の更新をまとめる関数
function updateAllDisplayData() {
    // 日程タブ
    displaySchedule(); 
    // 順位タブ
    updateRankChangeArrows();
    // 選手戦績タブ
    updatePlayerRecords('goalPlayersTable', 'goalPlayers');
    updatePlayerRecords('assistPlayersTable', 'assistPlayers');
    updatePlayerRecords('goalAssistPlayersTable', ['goalPlayers', 'assistPlayers']);
    updatePlayerRecordsWithTeam('goalTeamsTable', ['goalPlayers']);
    updatePlayerRecordsWithTeam('assistTeamsTable', ['assistPlayers']);
    updatePlayerRecordsWithTeam('totalPlayersTable', ['goalPlayers', 'assistPlayers']);
    toggleRecordTable();
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
// 日程表を表示する関数
function displaySchedule(schedule = null) {
    if (!matchDataL[currentSeason]) return;
    let startDateStr = matchDataL[currentSeason].newDate;
    let startDate = new Date(startDateStr);
    if (!schedule) {
        schedule = [];
        let totalMatches = Object.keys(matchDataL[currentSeason]).length - 3;
        let numRounds = totalMatches / (matchDataL[currentSeason].teamsNum / 2);
        for (let round = 0; round < numRounds; round++) {
            let roundMatches = [];
            let roundStartDate = new Date(startDate);
            roundStartDate.setDate(startDate.getDate() + round * 7);
            for (let match = 0; match < matchDataL[currentSeason].teamsNum / 2; match++) {
                let matchKey = `round${round}-match${match}`;
                let matchDataLEntry = matchDataL[currentSeason][matchKey];
                // if (!matchDataLEntry) {
                //     console.warn(`試合データが見つかりません: ${matchKey}`);
                //     continue;
                // }  

                let homeTeam = teamsData.find(team => team.teamId === matchDataLEntry.home.teamId); 
                let awayTeam = teamsData.find(team => team.teamId === matchDataLEntry.away.teamId);
                
                let matchDate = matchDataLEntry?.date || roundStartDate.toISOString().split('T')[0];

                roundMatches.push({ 
                    home: getTeamNameByScreenSize(homeTeam), 
                    away: getTeamNameByScreenSize(awayTeam),
                    date: matchDate,
                    homeTeam,
                    awayTeam,
                    homeScore: matchDataLEntry.home.score != null ? matchDataLEntry.home.score : '',
                    awayScore: matchDataLEntry.away.score != null ? matchDataLEntry.away.score : ''
                });
            }
            schedule.push(roundMatches);
        }
    }

    let scheduleHTML = '';

    schedule.forEach((matches, i) => {
        let roundStartDate = new Date(startDate);
        roundStartDate.setDate(startDate.getDate() + i * 7);
        let weekInfo = `第${i + 1}節 ${roundStartDate.getFullYear()}年${roundStartDate.getMonth() + 1}月第${Math.ceil(roundStartDate.getDate() / 7)}週`;

        scheduleHTML += `<div class="round" id="round${i}" style="display: none;">`;

        scheduleHTML += `
            <div class="schedule-header sticky-header">
                <div class="button-container">
                    <button class="button-common button3" onclick="previousRound()">＜　前節</button>
                    <button class="button-common button4" onclick="nextRound()">次節　＞</button>
                </div>
                <h2 class="week-info">${weekInfo}</h2>
            </div>
        <div style="text-align: center; margin: 10px 0;">
            <img src="Pictures/logoMain.png" alt="Tomokinta League ロゴ" style="height: 40px;">
        </div>
        <div class="round-overview">`;
            matches.forEach((match, index) => {
                scheduleHTML += `
                    <div class="match-date-row">
                        ${match.date}
                    </div>
                    <table class="round-overview-table">
                        <tr class="match-row" onclick="scrollToMatch('goalDetailsTable${i}-${index}')">
                            <td>${match.homeTeam.teams}</td>
                            <td><img src="Pictures/Team${match.homeTeam.teamId}.jpg" alt="${match.home}" class="schedule-team-logo"></td>
                            <td><span>${match.homeScore}</span></td>
                            <td>-</td>
                            <td><span>${match.awayScore}</span></td>
                            <td><img src="Pictures/Team${match.awayTeam.teamId}.jpg" alt="${match.away}" class="schedule-team-logo"></td>
                            <td>${match.awayTeam.teams}</td>
                        </tr>
                    </table>`;
            });
        scheduleHTML += `
        </div>`;




        matches.forEach((matchEntry, index) => {
            scheduleHTML += `
                <div class="match-container">
                    <table id="goalDetailsTable${i}-${index}" class="match-table">
                        <thead>
                            <tr>
                                <td colspan="5"><input type="date" id="matchDate${i}-${index}" value="${matchEntry.date}" readonly></td>
                            </tr>
                            <tr>
                                <th id="homeTeam${i}-${index}">${matchEntry.home}</th>
                                <th><input type="number" id="homeScore${i}-${index}" min="0" value="${matchEntry.homeScore}" readonly></th>
                                <th> - </th>
                                <th><input type="number" id="awayScore${i}-${index}" min="0" value="${matchEntry.awayScore}" readonly></th>
                                <th id="awayTeam${i}-${index}">${matchEntry.away}</th>
                            </tr>
                        </thead>
                        <tbody id="goalDetailsBody${i}-${index}"></tbody>
                    </table>`;

            const statsTableElement = generateStatsTable(i, index);
            scheduleHTML += statsTableElement.outerHTML;
            scheduleHTML += `</div>`;
        });

        scheduleHTML += `</div>`;
    });

    document.getElementById('scheduleContent').innerHTML = scheduleHTML;

    for (let roundIndex = 0; roundIndex < schedule.length; roundIndex++) {
        for (let matchIndex = 0; matchIndex < schedule[roundIndex].length; matchIndex++) {
            loadmatchDataL(roundIndex, matchIndex);
        }
    }

    currentRound = calculateCurrentRound(startDate, schedule.length);
    showRound(currentRound);

    // **リンククリック時のスクロール動作を追加**
    // document.querySelectorAll(".match-link").forEach(link => {
    //     link.addEventListener("click", function (event) {
    //         event.preventDefault();
    //         let targetId = this.getAttribute("href").substring(1); // ID取得
    //         let targetElement = document.getElementById(targetId);
    //         if (targetElement) {
    //             let offset = 200; // 上部の固定部分の高さ
    //             let elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
    //             let offsetPosition = elementPosition - offset;
    
    //             window.scrollTo({
    //                 top: offsetPosition,
    //                 behavior: "smooth"
    //             });
    //         }
    //     });
    // });
    
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

// 得点詳細のスタッツ表を作成する関数
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

// 日程表データの自動読み込みをする関数
function loadmatchDataL(roundIndex, matchIndex) {

    // シーズンデータが存在しない場合は何もしない
    if (!matchDataL[currentSeason]) return;

    let matchKey = `round${roundIndex}-match${matchIndex}`;

    if (matchDataL[currentSeason][matchKey]) {
        let match = matchDataL[currentSeason][matchKey];
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
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 順位表タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 順位を計算する関数
function calculateStandings() {
    // シーズンデータが存在しない場合は空の配列を返す
    if (!matchDataL[currentSeason]) return [];

    let participatingTeams = new Set(); // 試合に出場したチームIDを格納するセット

    // 出場したチームの teamId をセットに追加
    for (const matchKey in matchDataL[currentSeason]) {
        if (matchKey === "teamsNum" || matchKey === "currentStandings"|| matchKey === "newDate") continue; // 試合データ以外はスキップ

        let match = matchDataL[currentSeason][matchKey];
        participatingTeams.add(match.home.teamId);
        participatingTeams.add(match.away.teamId);
    }

    // standings 配列に出場したチームのみ追加
    let standings = teamsData
        .filter(team => participatingTeams.has(team.teamId)) // 出場したチームのみ
        .map(team => ({
            teamId: team.teamId,
            points: 0,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalDifference: 0,
            totalGoals: 0,
            currentRank: null
        }));

    // スコアが入力されている試合の結果を元に順位計算
    for (const matchKey in matchDataL[currentSeason]) {
        if (matchKey === "teamsNum" || matchKey === "currentStandings"|| matchKey === "newDate") continue;
        
        let match = matchDataL[currentSeason][matchKey];
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
function updateRankChangeArrows() {
    let currentStandings = matchDataL[currentSeason]?.currentStandings || [];
    let standings = calculateStandings(); // 現在の順位を再計算

    let tbody = document.querySelector('#standingsTable tbody');
    tbody.innerHTML = ''; // 順位表を初期化

    standings.forEach(team => {
        // `teamId` に対応する `previousRank` を取得
        let previousRank = currentStandings.findIndex(t => t.teamId === team.teamId) + 1;
        let currentRank = team.currentRank;

        let rankChange = '';
        let rankClass = '';

        // previousRank と currentRank を比較して順位の変動をチェック
        if (previousRank > 0) { // `findIndex` は見つからないと `-1` を返すので、順位がある場合のみ処理
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
            rankChange = '-'; // 初回のデータがない場合
            rankClass = 'rank-no-change';
        }

        let teamInfo = teamsData.find(t => t.teamId === team.teamId);
        let teamName = getTeamNameByScreenSize(teamInfo); // 画面幅に応じたチーム名
        let teamColor = teamInfo ? `${teamInfo.teamsColor}` : "FFFFFF"; // デフォルト白
        let teamSubColor = teamInfo ? `${teamInfo.teamsSubColor}` : "FFFFFF"; // デフォルト白
        let textColor = getTextColor(teamColor);

        let row = `
            <tr>
                <td>${team.currentRank} <span class="${rankClass}">${rankChange}</span></td>
                <td style="
                    background-color:#${teamColor}; 
                    background: linear-gradient(to bottom, #${teamSubColor} 0%, #${teamSubColor} 10%, #${teamColor} 30%, #${teamColor} 70%, #${teamSubColor} 90%);
                    color: #${textColor}; font-weight:bold; 
                    text-align:center;">${teamName}</td>
                <td><img src="Pictures/Team${teamInfo.teamId}.jpg"class="rank-team-logo"></td>
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
// チームごとのランキング（ゴール・アシスト・ゴール+アシスト）
function updatePlayerRecordsWithTeam(tableId, recordTypes) {
    if (!currentMatchData[currentSeason]) return;

    let records = {};

    Object.keys(currentMatchData[currentSeason]).forEach(matchKey => {
        if (["teamsNum", "currentStandings", "newDate"].includes(matchKey)) return;

        let match = currentMatchData[currentSeason][matchKey];

        ["home", "away"].forEach(side => {
            if (!match[side]) return;

            let teamId = match[side].teamId;

            recordTypes.forEach(recordType => {
                match[side][recordType].forEach(player => {
                    if (player && player.trim() !== "") { // 空白データを無視
                        let key = `${player}#${teamId}`;
                        records[key] = (records[key] || 0) + 1;
                    }
                });
            });
        });
    });

    displayPlayerRankingWithTeamInfo(tableId, records);
}

// ランキング表示（チーム名あり）
function displayPlayerRankingWithTeamInfo(tableId, records) {
    let table = document.getElementById(tableId);
    if (!table) return;

    let sortedRecords = Object.entries(records).sort((a, b) => b[1] - a[1]);
    let tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    let rank = 1, prevScore = null, displayRank = rank;

    sortedRecords.forEach(([key, count], index) => {
        let [player, teamId] = key.split("#");
        let teamInfo = teamsData.find(t => t.teamId == teamId);
        let teamName = teamInfo ? teamInfo.teams : "不明";

        if (prevScore !== count) displayRank = rank;
        prevScore = count;
        rank++;

        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${displayRank}</td>  <!-- 順位 -->
                <td>${player}</td>  <!-- 選手名 -->
                <td>${teamName}</td>  <!-- チーム名 -->
                <td>${count}</td>  <!-- 記録数 -->
            </tr>
        `);
    });
}