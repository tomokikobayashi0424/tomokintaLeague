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
    // updateStandingsTable();
    updateRankChangeArrows();
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
    if (!matchDataLCoop[currentSeason]) return;
    let startDateStr = matchDataLCoop[currentSeason].newDate;
    let startDate = new Date(startDateStr);
    if (!schedule) {
        schedule = [];
        let totalMatches = Object.keys(matchDataLCoop[currentSeason]).length - 4; 
        let numRounds = totalMatches / (matchDataLCoop[currentSeason].teamsNum / 2);
        for (let round = 0; round < numRounds; round++) {
            let roundMatches = [];
            let roundStartDate = new Date(startDate);
            roundStartDate.setDate(startDate.getDate() + round * 7);
            for (let match = 0; match < matchDataLCoop[currentSeason].teamsNum / 2; match++) {
                let matchKey = `round${round}-match${match}`;
                let matchDataLCoopEntry = matchDataLCoop[currentSeason][matchKey];
                if (!matchDataLCoopEntry) {
                    console.warn(`試合データが見つかりません: ${matchKey}`);
                    continue;
                }

                // **複合チームのチーム名を取得**
                let homeTeams = (matchDataLCoopEntry.home.teamIds || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? getTeamNameByScreenSize(team) : "不明";
                    })
                    .join("<br>");  // HTML内で改行
                let homeTeamNames = (matchDataLCoopEntry.home.teamIds || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? team.teams : "不明";
                    })
                    .join("<br>");  // HTML内で改行

                let awayTeams = (matchDataLCoopEntry.away.teamIds || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? getTeamNameByScreenSize(team) : "不明";
                    })
                    .join("<br>");  // HTML内で改行
                let awayTeamNames = (matchDataLCoopEntry.away.teamIds || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? team.teams : "不明";
                    })
                    .join("<br>");  // HTML内で改行

                let matchDate = matchDataLCoopEntry?.date || roundStartDate.toISOString().split('T')[0];

                roundMatches.push({
                    home: homeTeams, 
                    away: awayTeams,
                    homeTeamNames:homeTeamNames,
                    awayTeamNames:awayTeamNames,
                    homeTeamIds: matchDataLCoopEntry.home.teamIds || [],
                    awayTeamIds: matchDataLCoopEntry.away.teamIds || [],
                    date: matchDate,
                    matchKey: matchKey
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

        scheduleHTML += `<div class="round" id="round${i}" style="display: none;">
            <div class="schedule-header sticky-header">
                <div class="button-container">
                    <button class="button-common button3" onclick="previousRound()">＜　前節</button>
                    <button class="button-common button4" onclick="nextRound()">次節　＞</button>
                </div>
                <h2 class="week-info">${weekInfo}</h2>
            </div>
            <div style="text-align: center; margin: 10px 0;">
                <img src="Pictures/logoCoop.png" alt="Tomokinta League ロゴ" style="height: 40px;">
            </div>
            <div class="round-overview">`;
            matches.forEach((matchEntry, index) => {
                let matchKey = matchEntry.matchKey;
                let matchDataLCoopEntry = matchDataLCoop[currentSeason][matchKey];

                if (!matchDataLCoopEntry) {
                    console.warn(`試合データが見つかりません: ${matchKey}`);
                    return;
                }

                // **チームロゴも改行してすべて表示**
                let homeLogos = matchEntry.homeTeamIds
                    .map(teamId => `<img src="Pictures/Team${teamId}.jpg" class="schedule-coop-logo">`)
                    .join(""); // <br> は不要

                let awayLogos = matchEntry.awayTeamIds
                    .map(teamId => `<img src="Pictures/Team${teamId}.jpg" class="schedule-coop-logo">`)
                    .join(""); // <br> は不要

                    // **時刻を追加する処理**
    let baseHour = 22;
    let baseMinute = 30;
    let totalMinutes = baseHour * 60 + baseMinute + index * 15;
    let matchHour = Math.floor(totalMinutes / 60);
    let matchMinute = totalMinutes % 60;
    let matchTimeStr = `${String(matchHour).padStart(2, '0')}:${String(matchMinute).padStart(2, '0')}`;


                scheduleHTML += `
                    <div class="match-date-row">
                        ${matchEntry.date} ${matchTimeStr}キックオフ
                    </div>
                    <table class="round-overview-table">
                        <tr onclick="scrollToMatch('goalDetailsTable${i}-${index}')" class="match-row">
                            <td>${matchEntry.homeTeamNames}</td>
                            <td>${homeLogos}</td>
                            <td><span>${matchDataLCoopEntry.home.score ?? ''}</span></td>
                            <td>-</td>
                            <td><span>${matchDataLCoopEntry.away.score ?? ''}</span></td>
                            <td>${awayLogos}</td>
                            <td>${matchEntry.awayTeamNames}</td>
                        </tr>
                    </table>`;
            });
        scheduleHTML += `
        </div>`;

        // **試合詳細**
        matches.forEach((matchEntry, index) => {
            let matchKey = matchEntry.matchKey;
            let matchDataLCoopEntry = matchDataLCoop[currentSeason][matchKey];

            if (!matchDataLCoopEntry) return;

            scheduleHTML += `
                <div class="match-container">
                    <table id="goalDetailsTable${i}-${index}" class="match-table">
                        <thead>
                            <tr>
                                <td colspan="5"><input type="date" id="matchDate${i}-${index}" value="${matchEntry.date}" readonly></td>
                            </tr>
                            <tr>
                                <th id="homeTeam${i}-${index}">${matchEntry.home}</th>
                                <th> <input type="number" id="homeScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'home')" readonly></th>
                                <th> - </th>
                                <th> <input type="number" id="awayScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'away')" readonly></th>
                                <th id="awayTeam${i}-${index}">${matchEntry.away}</th>
                            </tr>
                        </thead>
                        <tbody id="goalDetailsBody${i}-${index}"></tbody>
                    </table>`;

            // **スタッツテーブルとポイントテーブル**
            const statsTableElement = generateStatsTable(i, index);
            scheduleHTML += statsTableElement.outerHTML;
            scheduleHTML += generatePointTable(i, index, matchDataLCoopEntry).outerHTML;
            scheduleHTML += `</div>`;
        });

        scheduleHTML += `</div>`;
    });

    document.getElementById('scheduleContent').innerHTML = scheduleHTML;

    for (let roundIndex = 0; roundIndex < schedule.length; roundIndex++) {
        for (let matchIndex = 0; matchIndex < schedule[roundIndex].length; matchIndex++) {
            loadMatchData(roundIndex, matchIndex);
        }
    }

    currentRound = calculateCurrentRound(startDate, schedule.length);
    showRound(currentRound);
}

// // 日程表の自動スクロールする関数
// function scrollToMatch(targetId) {
//     let targetElement = document.getElementById(targetId);
//     if (targetElement) {
//         let offset = 200; // 固定ヘッダー分のオフセット
//         let elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
//         let offsetPosition = elementPosition - offset;

//         window.scrollTo({
//             top: offsetPosition,
//             behavior: "smooth"
//         });
//     }
// }
// 試合詳細のスタッツ表を生成する関数
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
        homeHalfInput.readOnly = true;  // readonlyを追加

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
        homeHalfInput.readOnly = true;  // readonlyを追加

        // アウェーチームのフルタイム入力欄
        const awayFullInput = document.createElement('input');
        awayFullInput.type = "number";
        awayFullInput.id = `awayFullStat${index}-${roundIndex}-${matchIndex}`;
        awayFullInput.placeholder = "0";
        awayFullInput.min = (index === 0) ? "0" : "0";
        awayFullInput.max = (index === 0) ? "100" : "";
        homeHalfInput.readOnly = true;  // readonlyを追加

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

// ポイント表を表示する関数
function generatePointTable(roundIndex, matchIndex, matchData) {
    if (!matchData || !matchData.home || !matchData.away) {
        console.error(`試合データが不正です: round${roundIndex}-match${matchIndex}`, matchData);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    const homeTeamIds = matchData.home.teamIds || [];
    const awayTeamIds = matchData.away.teamIds || [];

    if (!Array.isArray(homeTeamIds) || !Array.isArray(awayTeamIds)) {
        console.error(`チームIDの配列が不正です: homeTeamIds=${homeTeamIds}, awayTeamIds=${awayTeamIds}`);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    return createPointTable(
        ["総合ポイント", "オフェンスポジショニング", "シュート", "デュエル", "ディフェンスポジショニング", "パス", "ドリブル"], 
        roundIndex, matchIndex, homeTeamIds, awayTeamIds
    );
}

// ポイント表を作成する関数
function createPointTable(pointCategories, roundIndex, matchIndex, homeTeamIds = [], awayTeamIds = []) {
    if (!Array.isArray(homeTeamIds) || !Array.isArray(awayTeamIds)) {
        console.error(`チームIDが配列でない: home=${homeTeamIds}, away=${awayTeamIds}`);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    const table = document.createElement('table');
    table.classList.add('points-table');

    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // 左上の空白セル

    // ホームチームのヘッダー
    homeTeamIds.forEach((teamId) => {
        const team = teamsData.find(t => t.teamId === teamId);
        const teamName = team ? getTeamNameByScreenSize(team) : "不明";
        const homeHeader = document.createElement('th');
        homeHeader.textContent = teamName;
        headerRow.appendChild(homeHeader);
    });

    const vsHeader = document.createElement('th');
    vsHeader.textContent = "VS";
    headerRow.appendChild(vsHeader);

    // アウェイチームのヘッダー
    awayTeamIds.forEach((teamId) => {
        const team = teamsData.find(t => t.teamId === teamId);
        const teamName = team ? getTeamNameByScreenSize(team) : "不明";
        const awayHeader = document.createElement('th');
        awayHeader.textContent = teamName;
        headerRow.appendChild(awayHeader);
    });

    table.appendChild(headerRow);

    // **各カテゴリごとの行（総合ポイントも手動入力）**
    pointCategories.forEach((category, statIndex) => {
        const row = document.createElement('tr');
        const categoryCell = document.createElement('td');
        categoryCell.textContent = category;
        row.appendChild(categoryCell);

        homeTeamIds.forEach((_, index) => {
            const homeInput = document.createElement('input');
            homeInput.type = "number";
            homeInput.id = `homePoint${statIndex}-${index}-${roundIndex}-${matchIndex}`;
            homeInput.placeholder = "0";
            homeInput.min = "0";
            row.appendChild(document.createElement('td')).appendChild(homeInput);
        });

        row.appendChild(document.createElement('td')).textContent = "-";

        awayTeamIds.forEach((_, index) => {
            const awayInput = document.createElement('input');
            awayInput.type = "number";
            awayInput.id = `awayPoint${statIndex}-${index}-${roundIndex}-${matchIndex}`;
            awayInput.placeholder = "0";
            awayInput.min = "0";
            row.appendChild(document.createElement('td')).appendChild(awayInput);
        });

        table.appendChild(row);
    });

    return table;
}

// 試合データを読み込む関数
function loadMatchData(roundIndex, matchIndex) {
    if (!matchDataLCoop[currentSeason]) return;

    let matchKey = `round${roundIndex}-match${matchIndex}`;

    if (matchDataLCoop[currentSeason][matchKey]) {
        let match = matchDataLCoop[currentSeason][matchKey];

        // スコアを表示
        document.getElementById(`homeScore${roundIndex}-${matchIndex}`).value = match.home.score !== null ? match.home.score : '';
        document.getElementById(`awayScore${roundIndex}-${matchIndex}`).value = match.away.score !== null ? match.away.score : '';

        // // スコアを表示
        // let homeScoreEl = document.getElementById(`homeScore${roundIndex}-${matchIndex}`);
        // let awayScoreEl = document.getElementById(`awayScore${roundIndex}-${matchIndex}`);
        // if (homeScoreEl) homeScoreEl.value = match.home.score !== null ? match.home.score : '';
        // if (awayScoreEl) awayScoreEl.value = match.away.score !== null ? match.away.score : '';

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
            document.getElementById(`homeHalfStat${index}-${roundIndex}-${matchIndex}`).value = match.home.halfTime[category] !== null ? match.home.halfTime[category] : '';
            document.getElementById(`homeFullStat${index}-${roundIndex}-${matchIndex}`).value = match.home.fullTime[category] !== null ? match.home.fullTime[category] : '';
            document.getElementById(`awayHalfStat${index}-${roundIndex}-${matchIndex}`).value = match.away.halfTime[category] !== null ? match.away.halfTime[category] : '';
            document.getElementById(`awayFullStat${index}-${roundIndex}-${matchIndex}`).value = match.away.fullTime[category] !== null ? match.away.fullTime[category] : '';
        });
        // 【追加】pointsデータの読み込み（totalPointを含む）
        const pointCategories = [
            "totalPoint", 
            "OffensePositioning", 
            "shot", 
            "duel", 
            "defensePositioning", 
            "pass", 
            "dribble"
        ];

        pointCategories.forEach((category, statIndex) => {
            match.home.teamIds.forEach((teamId, teamIndex) => {
                let homePointEl = document.getElementById(`homePoint${statIndex}-${teamIndex}-${roundIndex}-${matchIndex}`);
                if (homePointEl) {
                    homePointEl.value = match.home.points?.[category]?.[teamIndex] !== null ? match.home.points[category][teamIndex] : '';
                }
            });

            match.away.teamIds.forEach((teamId, teamIndex) => {
                let awayPointEl = document.getElementById(`awayPoint${statIndex}-${teamIndex}-${roundIndex}-${matchIndex}`);
                if (awayPointEl) {
                    awayPointEl.value = match.away.points?.[category]?.[teamIndex] !== null ? match.away.points[category][teamIndex] : '';
                }
            });
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
// 順位を決める関数
function calculateStandings() {
    if (!matchDataLCoop[currentSeason]) return [];

    let participatingTeams = new Set();
    let teamGroups = new Map();

    for (const matchKey in matchDataLCoop[currentSeason]) {
        if (["teamsNum", "currentStandings", "newDate", "teamSize"].includes(matchKey)) continue;

        let match = matchDataLCoop[currentSeason][matchKey];
        let homeTeamKey = match.home.teamIds.sort().join("-");
        let awayTeamKey = match.away.teamIds.sort().join("-");

        participatingTeams.add(homeTeamKey);
        participatingTeams.add(awayTeamKey);

        if (!teamGroups.has(homeTeamKey)) teamGroups.set(homeTeamKey, match.home.teamIds);
        if (!teamGroups.has(awayTeamKey)) teamGroups.set(awayTeamKey, match.away.teamIds);
    }

    let standings = Array.from(participatingTeams).map(teamKey => ({
        teamKey: teamKey, 
        teamIds: teamGroups.get(teamKey), 
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalDifference: 0,
        totalGoals: 0,
        totalPoints: {},  // 各チームの総合ポイント
        currentRank: null
    }));

    for (const matchKey in matchDataLCoop[currentSeason]) {
        if (["teamsNum", "currentStandings", "newDate", "teamSize"].includes(matchKey)) continue;

        let match = matchDataLCoop[currentSeason][matchKey];
        let homeScore = match.home.score;
        let awayScore = match.away.score;

        if (homeScore === null || awayScore === null) continue;

        let homeTeamKey = match.home.teamIds.sort().join("-");
        let awayTeamKey = match.away.teamIds.sort().join("-");
        let homeTeam = standings.find(t => t.teamKey === homeTeamKey);
        let awayTeam = standings.find(t => t.teamKey === awayTeamKey);

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

            // **試合ごとの `totalPoint` を正しく合計**
            match.home.teamIds.forEach((teamId, index) => {
                if (!homeTeam.totalPoints[teamId]) homeTeam.totalPoints[teamId] = 0;
                homeTeam.totalPoints[teamId] += match.home.points?.totalPoint?.[index] ?? 0;
            });

            match.away.teamIds.forEach((teamId, index) => {
                if (!awayTeam.totalPoints[teamId]) awayTeam.totalPoints[teamId] = 0;
                awayTeam.totalPoints[teamId] += match.away.points?.totalPoint?.[index] ?? 0;
            });
        }
    }

    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.totalGoals - a.totalGoals;
    });

    standings.forEach((standing, index) => {
        standing.currentRank = index + 1;
    });

    return standings;
}

function updateRankChangeArrows() {
    if (!matchDataLCoop[currentSeason].currentStandings) return;

    let previousStandings = matchDataLCoop[currentSeason].currentStandings || []; // 保存されている前回の順位
    let currentStandings = calculateStandings(); // 最新の順位

    let tbody = document.querySelector('#standingsTable tbody');
    tbody.innerHTML = ''; // 順位表をリセット

    currentStandings.forEach((team, index) => {
        let previousIndex = previousStandings.findIndex(t => t.teamIds.sort().join("-") === team.teamIds.sort().join("-"));
        let previousRank = previousIndex >= 0 ? previousIndex + 1 : null;
        let currentRank = index + 1;

        let rankChange = '';
        let rankClass = '';

        if (previousRank !== null) {
            if (currentRank < previousRank) {
                rankChange = '▲';
                rankClass = 'rank-up';
            } else if (currentRank > previousRank) {
                rankChange = '▼';
                rankClass = 'rank-down';
            } else {
                rankChange = '---';
                rankClass = 'rank-no-change';
            }
        } else {
            rankChange = '-';
            rankClass = 'rank-no-change';
        }

        // チーム名を改行して表示
        let teamNames = team.teamIds.map(teamId => {
            let teamInfo = teamsData.find(t => t.teamId === teamId);
            return teamInfo ? getTeamNameByScreenSize(teamInfo) : "不明";
        });

        // チームロゴも改行して表示
        let teamLogos = team.teamIds.map(teamId => {
            return `<img src="Pictures/Team${teamId}.jpg" class="rank-team-logo">`;
        }).join("<br>");

        // チームのカラーを配列で取得
        let teamColors = team.teamIds.map(teamId => {
            let teamInfo = teamsData.find(t => t.teamId === teamId);
            return teamInfo ? `${teamInfo.teamsColor}` : "000000";
        });

        let teamSubColors = team.teamIds.map(teamId => {
            let teamInfo = teamsData.find(t => t.teamId === teamId);
            return teamInfo ? `${teamInfo.teamsSubColor}` : "FFFFFF";
        });

        // テキストカラーを配列で取得
        let textColors = teamColors.map(color => getTextColor(color));
        console.log("Team Color:", teamColors);
        console.log("Text Color:", textColors);
        // 背景を複数のチームカラーでグラデーションに設定（CSSのbackgroundプロパティ用）
        let backgroundGradient = `linear-gradient(to bottom, ${teamColors.map((color, index) => 
            `#${color} ${(index / teamColors.length) * 100}%, #${color} ${((index + 1) / teamColors.length) * 100}%`
        ).join(', ')})`;

        // チーム名をそれぞれの色で表示
        let formattedTeamNames = teamNames.map((name, index) => 
            `<span style="color: #${textColors[index]}; font-weight: bold;">${name}</span>`
        ).join("<br>");

        let totalPointsText = team.teamIds.map(teamId => {
            return team.totalPoints[teamId] !== undefined ? team.totalPoints[teamId] : 0;
        }).join("<br>");

        let row = `
            <tr>
                <td>${currentRank} <span class="${rankClass}">${rankChange}</span></td>
                <td style="
                    background: ${backgroundGradient}; /* 修正: background-color ではなく background */
                    font-weight:bold; 
                    text-align:center;">
                    ${formattedTeamNames}
                </td>
                <td>${teamLogos}</td>
                <td>${team.points}</td>
                <td>${team.matchesPlayed}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalDifference}</td>
                <td>${team.totalGoals}</td>
                <td>${totalPointsText}</td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}













