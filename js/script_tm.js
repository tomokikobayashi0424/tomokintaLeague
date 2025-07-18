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
    // トーナメント表タブ
    // generateTournamentBracket();
    // 選手戦績タブ
    updatePlayerRecords('goalPlayersTable', 'goalPlayers');
    updatePlayerRecords('assistPlayersTable', 'assistPlayers');
    updatePlayerRecords('goalAssistPlayersTable', ['goalPlayers', 'assistPlayers']);
    // updatePlayerRecordsWithTeam('goalTeamsTable', ['goalPlayers']);
    // updatePlayerRecordsWithTeam('assistTeamsTable', ['assistPlayers']);
    // updatePlayerRecordsWithTeam('totalPlayersTable', ['goalPlayers', 'assistPlayers']);
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
    if (!matchDataTM[currentSeason]) return;

    let startDateStr = matchDataTM[currentSeason].newDate;
    let startDate = new Date(startDateStr);
    
    // 保存されたスケジュールを取得
    if (!schedule) {
        schedule = [];
        let numRounds = 1;

        for (let round = 0; round < numRounds; round++) {
            let roundMatches = [];
            let roundStartDate = new Date(startDate);
            roundStartDate.setDate(startDate.getDate() + round * 7);

            for (let match = 0; match < matchDataTM[currentSeason].teamsNum / 2; match++) {
                let matchKey = `round${round}-match${match}`;
                let matchDataTMEntry = matchDataTM[currentSeason][matchKey];
                let matchDate = matchDataTMEntry?.date || roundStartDate.toISOString().split('T')[0];

                if (!matchDataTMEntry) {
                    console.warn(`試合データが見つかりません: ${matchKey}`);
                    continue;
                }

                // 複合チームのチーム名を取得
                let homeTeams = (matchDataTMEntry.home.teamIds || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? getTeamNameByScreenSize(team) : "不明";
                    })
                    .join("<br>");  // HTML内で改行

                let awayTeams = (matchDataTMEntry.away.teamIds || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? getTeamNameByScreenSize(team) : "不明";
                    })
                    .join("<br>");  // HTML内で改行

                
                roundMatches.push({
                    home: homeTeams, 
                    away: awayTeams,
                    date: matchDate,
                    matchKey: matchKey  // 後で試合データを取得するためにキーを保存
                });
            }
            schedule.push(roundMatches);
        }
    }

    let scheduleHTML = '';
    for (let i = 0; i < schedule.length; i++) {
        let roundStartDate = new Date(startDate);
        roundStartDate.setDate(startDate.getDate() + i * 7);
        let weekInfo = `${roundStartDate.getFullYear()}年${roundStartDate.getMonth() + 1}月第${Math.ceil(roundStartDate.getDate() / 7)}週`;

        scheduleHTML += `<div class="round" id="round${i}" style="display: none;">
            <div class="schedule-header sticky-header">
                <div class="button-container">
                    <img src="Pictures/logoL.png" alt="Tomokinta League ロゴ" class="schedule-logo">
                </div>
                <h2 class="week-info">${weekInfo}</h2>
            </div>`;
        // **目次エリアを作成**
        let hasValidMatches = schedule[i].some(match => match.homeTeam && match.awayTeam);
        if (hasValidMatches) {
            scheduleHTML += `
            <div class="round-overview">
                `;

            schedule[i].forEach((match, index) => {
                if (!match.homeTeam || !match.awayTeam) return; // **対戦相手が不明な試合は目次に表示しない**
                scheduleHTML += `
                    <div class="match-date-row">
                        ${match.date}
                    </div>
                    <table class="round-overview-table">
                        <tr onclick="scrollToMatch('goalDetailsTable${i}-${index}')" class="match-row">
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
        }

        // **試合詳細を作成**
        schedule[i].forEach((matchEntry, index) => {
            let matchKey = matchEntry.matchKey;  // 保存しておいたキーを取得
            let matchDataTMEntry = matchDataTM[currentSeason][matchKey];  // 正しい試合データを取得

            if (!matchDataTMEntry) {
                console.warn(`試合データが見つかりません: ${matchKey}`);
                return;
            }

            scheduleHTML += `
                <div class="match-container">
                    <table id="goalDetailsTable${i}-${index}" class="match-table">
                        <thead>
                            <tr>
                                <td colspan="5">日付: <input type="date" id="matchDate${i}-${index}" value="${matchEntry.date}" readonly></td>
                            </tr>
                            <tr>
                                <th id="homeTeam${i}-${index}">${matchEntry.home}</th>
                                <th> <input type="number" id="homeScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'home')" readonly></th>
                                <th> - </th>
                                <th> <input type="number" id="awayScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'away')" readonly></th>
                                <th id="awayTeam${i}-${index}">${matchEntry.away}</th>
                            </tr>
                            <tr>
                                <td colspan="2"><label>PK</label> <input type="number" id="homePK${i}-${index}" min="0" placeholder="0" readonly></td>
                                <td>PK戦</td>
                                <td colspan="2"><label>PK</label> <input type="number" id="awayPK${i}-${index}" min="0" placeholder="0" readonly></td>
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

    // **現在のラウンドを計算**
    currentRound = calculateCurrentRound(startDate, schedule.length);
    showRound(currentRound);
}

// 得点詳細のスタッツ表を作成する関数
function createStatsTable(statCategories, roundIndex, matchIndex) {
    const table = document.createElement('table');
    table.classList.add('stats-table'); // スタイルクラスを追加

    // 1行目に「ハーフタイム」「フルタイム」「空白」「ハーフタイム」「フルタイム」ヘッダを追加
    const headerRow = document.createElement('tr');

    // const homeHalfHeader = document.createElement('th');
    // homeHalfHeader.textContent = "ハーフタイム";
    
    const homeFullHeader = document.createElement('th');
    homeFullHeader.textContent = "フルタイム";

    const spacerHeader = document.createElement('th');
    spacerHeader.textContent = ""; // 空白のセル

    // const awayHalfHeader = document.createElement('th');
    // awayHalfHeader.textContent = "ハーフタイム";
    
    const awayFullHeader = document.createElement('th');
    awayFullHeader.textContent = "フルタイム";

    // headerRow.appendChild(homeHalfHeader);
    headerRow.appendChild(homeFullHeader);
    headerRow.appendChild(spacerHeader);
    // headerRow.appendChild(awayHalfHeader);
    headerRow.appendChild(awayFullHeader);

    table.appendChild(headerRow);

    // 2行目以降にスタッツ行を追加
    statCategories.forEach((category, index) => {
        const row = document.createElement('tr');

        // ホームチームのハーフタイム入力欄
        // const homeHalfInput = document.createElement('input');
        // homeHalfInput.type = "number";
        // homeHalfInput.id = `homeHalfStat${index}-${roundIndex}-${matchIndex}`;
        // homeHalfInput.placeholder = "0";
        // homeHalfInput.min = (index === 0) ? "0" : "0";  // 支配率なら0～100に制限
        // homeHalfInput.max = (index === 0) ? "100" : "";
        // homeHalfInput.readOnly = true;  // readonlyを追加

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
        // const awayHalfInput = document.createElement('input');
        // awayHalfInput.type = "number";
        // awayHalfInput.id = `awayHalfStat${index}-${roundIndex}-${matchIndex}`;
        // awayHalfInput.placeholder = "0";
        // awayHalfInput.min = (index === 0) ? "0" : "0";
        // awayHalfInput.max = (index === 0) ? "100" : "";
        // awayHalfInput.readOnly = true;  // readonlyを追加

        // アウェーチームのフルタイム入力欄
        const awayFullInput = document.createElement('input');
        awayFullInput.type = "number";
        awayFullInput.id = `awayFullStat${index}-${roundIndex}-${matchIndex}`;
        awayFullInput.placeholder = "0";
        awayFullInput.min = (index === 0) ? "0" : "0";
        awayFullInput.max = (index === 0) ? "100" : "";
        awayFullInput.readOnly = true;  // readonlyを追加

        // 行にセルを追加
        // const homeHalfCell = document.createElement('td');
        // homeHalfCell.appendChild(homeHalfInput);
        
        const homeFullCell = document.createElement('td');
        homeFullCell.appendChild(homeFullInput);
        
        // const awayHalfCell = document.createElement('td');
        // awayHalfCell.appendChild(awayHalfInput);
        
        const awayFullCell = document.createElement('td');
        awayFullCell.appendChild(awayFullInput);

        // row.appendChild(homeHalfCell);
        row.appendChild(homeFullCell);
        row.appendChild(categoryCell);
        // row.appendChild(awayHalfCell);
        row.appendChild(awayFullCell);

        table.appendChild(row);
    });

    return table;
}

// 日程表データの自動読み込みをする関数
function loadMatchData(roundIndex, matchIndex) {
    // let currentSeason = "24-s1"; // 現在のシーズンを指定（必要に応じて変更）

    // シーズンデータが存在しない場合は何もしない
    if (!matchDataTM[currentSeason]) return;

    let matchKey = `round${roundIndex}-match${matchIndex}`;

    if (matchDataTM[currentSeason][matchKey]) {
        let match = matchDataTM[currentSeason][matchKey];
        // スコアを表示
        document.getElementById(`homeScore${roundIndex}-${matchIndex}`).value = match.home.score !== null ? match.home.score : '';
        document.getElementById(`awayScore${roundIndex}-${matchIndex}`).value = match.away.score !== null ? match.away.score : '';
        document.getElementById(`homePK${roundIndex}-${matchIndex}`).value = match.home.pk !== null ? match.home.pk : '';
        document.getElementById(`awayPK${roundIndex}-${matchIndex}`).value = match.away.pk !== null ? match.away.pk : '';

        // スタッツデータを表示（ハーフタイムとフルタイム）
        const statCategories = [
            "possession", 
            "shots", 
            "shotsonFrame", 
            "fouls", 
            "offsides", 
            "cornerKicks", 
            "freeKicks", 
            "passes", 
            "successfulPasses", 
            "crosses", 
            "PassCuts", 
            "successfulTackles", 
            "save"
        ];

        statCategories.forEach((category, index) => {
            // document.getElementById(`homeHalfStat${index}-${roundIndex}-${matchIndex}`).value = match.home.halfTime[category] !== null ? match.home.halfTime[category] : '';
            document.getElementById(`homeFullStat${index}-${roundIndex}-${matchIndex}`).value = match.home.fullTime[category] !== null ? match.home.fullTime[category] : '';
            // document.getElementById(`awayHalfStat${index}-${roundIndex}-${matchIndex}`).value = match.away.halfTime[category] !== null ? match.away.halfTime[category] : '';
            document.getElementById(`awayFullStat${index}-${roundIndex}-${matchIndex}`).value = match.away.fullTime[category] !== null ? match.away.fullTime[category] : '';
        });
        // スコアに基づいて得点詳細行を表示
        updateGoalDetails(roundIndex, matchIndex, 'home', match.home);
        updateGoalDetails(roundIndex, matchIndex, 'away', match.away);
    }
}