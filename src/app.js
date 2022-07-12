async function fetchMatches() {
  const URL =
    'https://web.scraper.workers.dev/?url=https%3A%2F%2Fwww.hltv.org%2Fmatches&selector=div.upcomingMatchesSection+div&scrape=attr&attr=&pretty=true';
  const response = await fetch(URL);
  const data = await response.json();
  return data.result['div.upcomingMatchesSection div'];
}
async function fetchDays() {
  const URL =
    'https://web.scraper.workers.dev/?url=https%3A%2F%2Fwww.hltv.org%2Fmatches&selector=.matchDayHeadline&scrape=text&pretty=true';
  const response = await fetch(URL);
  const data = await response.json();
  return data.result['.matchDayHeadline'];
}

function separateMatches(fetchedData) {
  let matchesArray = [];
  let matchArray = [];
  let separatorTrigger = false;
  for (let i = 0; i < fetchedData.length; i++) {
    //if an hour is found, check if it is for the current match or the next one
    if (/\d\d:\d\d/.test(fetchedData[i])) {
      //if there is already an hour in the match array, add the match and empty the array to create another
      if (separatorTrigger === true) {
        matchesArray.push(matchArray);
        matchArray = [];
        matchArray.push(fetchedData[i]);
      }

      //else, update the separator flag and just push the hour
      else {
        separatorTrigger = true;
        matchArray.push(fetchedData[i]);
      }
    } //if the last added item is the last one, also push the match into the matches array
    else if (i + 1 === fetchedData.length) {
      matchArray.push(fetchedData[i]);
      matchesArray.push(matchArray);
    }
    // for other data, just push it into the match array
    else {
      matchArray.push(fetchedData[i]);
    }
  }
  return matchesArray;
}
function organizeDays(organizedMatches, fetchedDays) {
  let lastHour = '';
  let counter = 0;
  let organizedDays = [];
  let matchesArray = [];

  for (let i in organizedMatches) {
    //if this is the first hour checked for:
    if (lastHour === '') {
      matchesArray.push(organizedMatches[i]);
      lastHour = parseInt(
        organizedMatches[i][0][0] + organizedMatches[i][0][1]
      );
      // console.log('counter: ', counter);
    }
    //if there are past hours:
    else {
      let newLastHour = parseInt(
        organizedMatches[i][0][0] + organizedMatches[i][0][1]
      );

      if (newLastHour < lastHour) {
        // console.log('new day');

        lastHour = newLastHour;
        organizedDays.push(fetchedDays[counter]);
        counter = counter + 1;
        organizedDays.push(matchesArray);
        matchesArray = [];
        matchesArray.push(organizedMatches[i]);
      } else {
        matchesArray.push(organizedMatches[i]);

        lastHour = parseInt(
          organizedMatches[i][0][0] + organizedMatches[i][0][1]
        );
        //console.log('same day');
      }
    }
  }
  return organizedDays;
}

function classifyData(cookedData) {
  class Day {
    constructor(date) {
      this.date = date;
      this.matches;
    }
    addMatch(match) {
      this.matches = match;
    }
  }
  class Match {
    constructor(hour, type, teams, tournament) {
      this.hour = hour;
      this.type = type;
      this.teams = teams;
      this.tournament = tournament;
    }
  }

  const CompleteDays = [];
  for (let dataIndex in cookedData) {
    let matchArray = [];
    if (dataIndex % 2 !== 0) {
      for (let matchIndex in cookedData[dataIndex]) {
        let hour = cookedData[dataIndex][matchIndex][0];
        let type = cookedData[dataIndex][matchIndex][1];
        let teamA;
        let teamB;
        let tournament;
        //if there are just 3 fields, that usually means known data is hour, type and tournament
        if (cookedData[dataIndex][matchIndex].length > 3) {
          teamA = cookedData[dataIndex][matchIndex][2];
          teamB = cookedData[dataIndex][matchIndex][3];
          tournament = cookedData[dataIndex][matchIndex][4];
        } else {
          teamA = 'TBC';
          teamB = 'TBC';
          tournament = cookedData[dataIndex][matchIndex][2];
        }
        const newMatch = new Match(hour, type, [teamA, teamB], tournament);
        matchArray.push(newMatch);
        //console.log(newMatch);
      }
      let newDay = new Day(cookedData[dataIndex - 1]);
      newDay.addMatch(matchArray);
      matchArray = [];
      //console.log(newDay);
      CompleteDays.push(newDay);
    }
  }
  return CompleteDays;
}

const cookData = async () => {
  let fetchedData = await fetchMatches();
  const organizedMatches = separateMatches(fetchedData);
  let fetchedDays = await fetchDays();

  const organizedDays = organizeDays(organizedMatches, fetchedDays);
  return organizedDays;
};

function drawData(classifiedData) {
  for (let dayIndex in classifiedData) {
    let Day;
    const DayList = document.createElement('ul');
    const DayHeader = document.createElement('h2');
    if (dayIndex == 0) {
      Day = 'Today';
      DayList.classList.add('today');
    } else {
      Day = classifiedData[dayIndex].date;
      DayList.classList.add('restDays');
    }
    DayHeader.innerHTML = `${Day}`;
    DayHeader.classList.add('dayHeader');
    DayHeader.id = `${Day}`;
    for (let matchIndex in classifiedData[dayIndex].matches) {
      //https://github.com/lootmarket/esport-team-logos/tree/master/csgo

      const Match = classifiedData[dayIndex].matches[matchIndex];
      const MatchElement = document.createElement('li');
      let TEAMA_URL = Match.teams[0].replaceAll(' ', '-');
      TEAMA_URL = TEAMA_URL.toLowerCase();
      let TEAMB_URL = Match.teams[1].replaceAll(' ', '-');
      TEAMB_URL = TEAMB_URL.toLowerCase();

      if (
        Match.teams[0] === 'TBC' ||
        Match.teams[0].includes('/') ||
        Match.teams[1].includes('winner')
      ) {
        TEAMA_URL = '';
      }
      if (
        Match.teams[1] === 'TBC' ||
        Match.teams[1].includes('/') ||
        Match.teams[1].includes('winner')
      ) {
        TEAMB_URL = '';
      }

      let TOURN_URL = '';
      if (
        Match.tournament.includes('ESL') ||
        Match.tournament.includes('IEM')
      ) {
        TOURN_URL =
          'https://img-cdn.hltv.org/eventlogo/QtzY_1lU9TI6DUETj2abFo.png?ixlib=java-2.1.0&w=50&s=e0567d28687f638172a2a0f35e6ca140';
      }
      if (Match.tournament.includes('ESEA')) {
        TOURN_URL =
          'https://img-cdn.hltv.org/eventlogo/b75aNG0i4UVPNQHX_Tq-Zq.png?ixlib=java-2.1.0&w=50&s=abd9825a16bb8b751c86d126865a5d9f';
      }
      if (Match.tournament.includes('Flow')) {
        TOURN_URL =
          'https://img-cdn.hltv.org/eventlogo/NXRVcPDMcDw7Zd1mPWitL4.png?ixlib=java-2.1.0&w=50&s=efe31ee3c1de397f0489052fe590b9b6';
      }

      MatchElement.innerHTML = `
      <div class="hourContainer">
        <p class="tooltip">Hour: </p>
        <p>${Match.hour}</p>
      </div>
      <div class="typeContainer">
        <p class="tooltip">Type: </p>
        <p>${Match.type}</p>
      </div>
      <div class="teamsColContainer">
        <p class="tooltip">Teams: </p>
        <div class="teamsContainer">
          <div class="teamAContainer">
          ${
            TEAMA_URL &&
            `<img class="teamLogo" src="https://github.com/lootmarket/esport-team-logos/blob/master/csgo/${TEAMA_URL}/${TEAMA_URL}-logo.png?raw=true">`
          }
          <p>${Match.teams[0]} </p>
          </div>
          <div class="teamSeparator"> <p>vs</p> </div>
          <div class="teamBContainer">
          ${
            TEAMB_URL &&
            `<img class="teamLogo" src="https://github.com/lootmarket/esport-team-logos/blob/master/csgo/${TEAMB_URL}/${TEAMB_URL}-logo.png?raw=true">`
          }
          <p>${Match.teams[1]}</p>
          </div>
        </div>
      </div>
      <div class="tournamentColContainer">
        <p class="tooltip">Tournament: </p>
        <div class="tournamentContainer">
          ${TOURN_URL && `<img src="${TOURN_URL}">`}
          <p>${Match.tournament}</p>
        </div>
      </div>
      `;
      DayList.appendChild(MatchElement);
    }
    const DaysContainer = document.createElement('div');
    DaysContainer.classList.add('dayContainer');
    DaysContainer.appendChild(DayHeader);
    DaysContainer.appendChild(DayList);
    document.querySelector('#matchesList').appendChild(DaysContainer);
  }
}

window.onload = async () => {
  const cookedData = await cookData();
  const classifiedData = classifyData(cookedData);
  drawData(classifiedData);
  console.log(classifiedData);
};
