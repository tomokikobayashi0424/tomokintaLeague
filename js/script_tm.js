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
    // 選手戦績タブ
    updatePlayerRecords('goalPlayersTable', 'goalPlayers');
    updatePlayerRecords('assistPlayersTable', 'assistPlayers');
    updatePlayerRecords('goalAssistPlayersTable', ['goalPlayers', 'assistPlayers']);
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

    // スケジュールデータの構築
    if (!schedule) {
        schedule = [];
        let numRounds = 2;
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
                let homeTeamIds = matchDataTMEntry.home.teamIds || [];
                let awayTeamIds = matchDataTMEntry.away.teamIds || [];
                let homeTeamNames = homeTeamIds.map(teamId => {
                    let team = teamsData.find(team => team.teamId === teamId);
                    return team ? team.teams : "不明";
                }).join("<br>");
                let awayTeamNames = awayTeamIds.map(teamId => {
                    let team = teamsData.find(team => team.teamId === teamId);
                    return team ? team.teams : "不明";
                }).join("<br>");
                let homeTeamSubNames = homeTeamIds.map(teamId => {
                    let team = teamsData.find(team => team.teamId === teamId);
                    return team ? getTeamNameByScreenSize(team) : "不明";
                }).join("<br>");
                let awayTeamSubNames = awayTeamIds.map(teamId => {
                    let team = teamsData.find(team => team.teamId === teamId);
                    return team ? getTeamNameByScreenSize(team) : "不明";
                }).join("<br>");
                let homeLogos = homeTeamIds.map(teamId => `<img src="Pictures/Team${teamId}.jpg" class="schedule-team-logo">`).join("<br>");
                let awayLogos = awayTeamIds.map(teamId => `<img src="Pictures/Team${teamId}.jpg" class="schedule-team-logo">`).join("<br>");
                roundMatches.push({
                    homeTeamNames,
                    awayTeamNames,
                    homeLogos,
                    awayLogos,
                    date: matchDate,
                    matchKey: matchKey,
                    homeTeamSubNames,
                    awayTeamSubNames
                });
            }
            schedule.push(roundMatches);
        }
    }

    // 西・東の総得点と勝ち点計算
    let totalWestScore = 0;
    let totalEastScore = 0;
    let totalWestPoints = 0;
    let totalEastPoints = 0;
    let numMatches = schedule[0]?.length || 0;
    for (let matchIndex = 0; matchIndex < numMatches; matchIndex++) {
        let match1 = schedule[0][matchIndex]; // 1stレグ
        let match2 = schedule[1][matchIndex]; // 2ndレグ
        let matchDataTMEntry1 = matchDataTM[currentSeason][match1.matchKey];
        let matchDataTMEntry2 = matchDataTM[currentSeason][match2.matchKey];

        // 西（1stレグhome, 2ndレグaway, PKもaway）
        let westScore = (Number(matchDataTMEntry1?.home?.score) || 0) + (Number(matchDataTMEntry2?.away?.score) || 0);
        let eastScore = (Number(matchDataTMEntry1?.away?.score) || 0) + (Number(matchDataTMEntry2?.home?.score) || 0);

        totalWestScore += westScore;
        totalEastScore += eastScore;

        // チーム構成数を取得
        let teamCount = matchDataTMEntry1.home.teamIds.length; // 1stレグhomeのチーム数で判定

        // 勝敗判定
        let winner = null;
        let isPK = false;
        if (westScore > eastScore) {
            winner = "west";
        } else if (westScore < eastScore) {
            winner = "east";
        } else {
            // PKで決着
            let westPK = Number(matchDataTMEntry2?.away?.pk) || 0;
            let eastPK = Number(matchDataTMEntry2?.home?.pk) || 0;
            isPK = true;
            if (westPK > eastPK) {
                winner = "west";
            } else if (westPK < eastPK) {
                winner = "east";
            }
        }

        // ポイント計算
        if (teamCount === 2 || teamCount === 3) {
            // 2ndレグのスコアが入力されている場合のみ加算
            const secondLegHomeScore = matchDataTMEntry2?.home?.score;
            const secondLegAwayScore = matchDataTMEntry2?.away?.score;
            const isSecondLegEntered = 
                (secondLegHomeScore !== undefined && secondLegHomeScore !== null && secondLegHomeScore !== "") ||
                (secondLegAwayScore !== undefined && secondLegAwayScore !== null && secondLegAwayScore !== "");

            if (isSecondLegEntered) {
                if (teamCount === 2) {
                    if (winner === "west") totalWestPoints += 2;
                    if (winner === "east") totalEastPoints += 2;
                } else if (teamCount === 3) {
                    if (winner === "west") totalWestPoints += 3;
                    if (winner === "east") totalEastPoints += 3;
                }
            }
        } else if (teamCount === 1) {
            // 個人戦は1レグだけでも得失点差を加算
            if (winner === "west") {
                if (isPK) {
                    totalWestPoints += 1;
                } else {
                    totalWestPoints += (westScore - eastScore);
                }
            }
            if (winner === "east") {
                if (isPK) {
                    totalEastPoints += 1;
                } else {
                    totalEastPoints += (eastScore - westScore);
                }
            }
        }
    }

    // 目次エリア
    let overviewHTML = `
    <table class="round-overview-table"><thead>
        <tr>
            <th>西</th>
            <th colspan="2">${totalWestPoints}pt</th>
            <th>-</th>
            <th colspan="2">${totalEastPoints}pt</th>
            <th>東</th>
        </tr>
    </thead>
    <tbody>`;

    schedule[0].forEach((match1, matchIndex) => {
        let match2 = schedule[1][matchIndex];
        let matchDataTMEntry1 = matchDataTM[currentSeason][match1.matchKey];
        let matchDataTMEntry2 = matchDataTM[currentSeason][match2.matchKey];

        let homeTeamNames = match1.homeTeamNames;
        let awayTeamNames = match1.awayTeamNames;
        let homeLogos = match1.homeLogos;
        let awayLogos = match1.awayLogos;

        // スコアを1セル内で改行してまとめる
        let homeScores = [
            matchDataTMEntry1?.home?.score ?? "",
            matchDataTMEntry2?.away?.score ?? "",
            matchDataTMEntry2?.away?.pk ?? ""
        ].join("<br>");
        let awayScores = [
            matchDataTMEntry1?.away?.score ?? "",
            matchDataTMEntry2?.home?.score ?? "",
            matchDataTMEntry2?.home?.pk ?? ""
        ].join("<br>");
        let hyphen = [
            "1st",
            "2nd", 
            "PK"
        ].join("<br>");

            overviewHTML += `
            <tr onclick="scrollToMatch('goalDetailsTable0-${matchIndex}')">
                <td>${homeTeamNames}</td>
                <td>${homeLogos}</td>
                <td>${homeScores}</td>
                <td>${hyphen}</td>
                <td>${awayScores}</td>
                <td>${awayLogos}</td>
                <td>${awayTeamNames}</td>
            </tr>
            `;
        });
    overviewHTML += `</tbody></table>
    <div class="ranking-rules">
        <h3>ポイント計算方式</h3>
        <p>個人戦の場合は、得失点差がポイントになる。同点の場合はPK勝者に1ポイント。
        <p>2人Coopの場合は、勝利で2ポイント、敗北で0ポイント。
        <p>3人Coopの場合は、勝利で3ポイント、敗北で0ポイント。
        <p>ポイントが同じ場合は、得失点差 → 総得点数の順で順位を決定される。
    </div>`;

    // 本体HTML生成
    let scheduleHTML = overviewHTML;

    schedule[0].forEach((matchEntry1, matchIndex) => {
        let matchKey1 = matchEntry1.matchKey;
        // let matchDataTMEntry1 = matchDataTM[currentSeason][matchKey1];

        scheduleHTML += `
            <div class="match-container">
                <table id="goalDetailsTable0-${matchIndex}" class="match-table">
                    <thead>
                        <tr>
                            <td colspan="5">1stレグ 日付: <input type="date" id="matchDate0-${matchIndex}" value="${matchEntry1.date}" readonly></td>
                        </tr>
                        <tr>
                            <th id="homeTeam0-${matchIndex}">${matchEntry1.homeTeamSubNames}</th>
                            <th> <input type="number" id="homeScore0-${matchIndex}" min="0" placeholder="0" onchange="updateGoalDetails(0, ${matchIndex}, 'home')" readonly></th>
                            <th> - </th>
                            <th> <input type="number" id="awayScore0-${matchIndex}" min="0" placeholder="0" onchange="updateGoalDetails(0, ${matchIndex}, 'away')" readonly></th>
                            <th id="awayTeam0-${matchIndex}">${matchEntry1.awayTeamSubNames}</th>
                        </tr>
                    </thead>
                    <tbody id="goalDetailsBody0-${matchIndex}"></tbody>
                </table>
                ${generateStatsTable(0, matchIndex).outerHTML}
            </div>
        `;

        // 2ndレグ
        let matchEntry2 = schedule[1][matchIndex];
        // let matchKey2 = matchEntry2.matchKey;
        // let matchDataTMEntry2 = matchDataTM[currentSeason][matchKey2];

        scheduleHTML += `
            <div class="match-container">
                <table id="goalDetailsTable1-${matchIndex}" class="match-table">
                    <thead>
                        <tr>
                            <td colspan="5">2ndレグ 日付: <input type="date" id="matchDate1-${matchIndex}" value="${matchEntry2.date}" readonly></td>
                        </tr>
                        <tr>
                            <th id="homeTeam1-${matchIndex}">${matchEntry2.homeTeamSubNames}</th>
                            <th> <input type="number" id="homeScore1-${matchIndex}" min="0" placeholder="0" onchange="updateGoalDetails(1, ${matchIndex}, 'home')" readonly></th>
                            <th> - </th>
                            <th> <input type="number" id="awayScore1-${matchIndex}" min="0" placeholder="0" onchange="updateGoalDetails(1, ${matchIndex}, 'away')" readonly></th>
                            <th id="awayTeam1-${matchIndex}">${matchEntry2.awayTeamSubNames}</th>
                        </tr>
                        <tr>
                            <td colspan="2"><label>PK</label> <input type="number" id="homePK1-${matchIndex}" min="0" placeholder="0" readonly></td>
                            <td>PK戦</td>
                            <td colspan="2"><label>PK</label> <input type="number" id="awayPK1-${matchIndex}" min="0" placeholder="0" readonly></td>
                        </tr>
                    </thead>
                    <tbody id="goalDetailsBody1-${matchIndex}"></tbody>
                </table>
                ${generateStatsTable(1, matchIndex).outerHTML}
            </div>
        `;
    });

    document.getElementById('scheduleContent').innerHTML = scheduleHTML;

    // データの自動読み込み
    schedule.forEach((roundMatches, roundIndex) => {
        roundMatches.forEach((_, matchIndex) => {
            loadMatchData(roundIndex, matchIndex);
        });
    });

    // 現在のラウンドを計算
    // currentRound = calculateCurrentRound(startDate, schedule.length);
    showRound(0);
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
    if (!matchDataTM[currentSeason]) return;

    let matchKey = `round${roundIndex}-match${matchIndex}`;

    if (matchDataTM[currentSeason][matchKey]) {
        let match = matchDataTM[currentSeason][matchKey];
        // スコアを表示
        document.getElementById(`homeScore${roundIndex}-${matchIndex}`).value = match.home.score !== null ? match.home.score : '';
        document.getElementById(`awayScore${roundIndex}-${matchIndex}`).value = match.away.score !== null ? match.away.score : '';

        // PKは2ndレグ（roundIndex === 1）の時だけ読み込む
        if (roundIndex === 1) {
            document.getElementById(`homePK${roundIndex}-${matchIndex}`).value = match.home.pk !== null ? match.home.pk : '';
            document.getElementById(`awayPK${roundIndex}-${matchIndex}`).value = match.away.pk !== null ? match.away.pk : '';
        }

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
            document.getElementById(`homeFullStat${index}-${roundIndex}-${matchIndex}`).value = match.home.fullTime[category] !== null ? match.home.fullTime[category] : '';
            document.getElementById(`awayFullStat${index}-${roundIndex}-${matchIndex}`).value = match.away.fullTime[category] !== null ? match.away.fullTime[category] : '';
        });
        // スコアに基づいて得点詳細行を表示
        updateGoalDetails(roundIndex, matchIndex, 'home', match.home);
        updateGoalDetails(roundIndex, matchIndex, 'away', match.away);
    }
}