const fs = require('fs');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhODRlNjA0OC05MTNmLTQzMTAtYjRkYy0xZTQyODUyNzY0ZjciLCJ1c2VybmFtZSI6ImFkbWluLnNjaG9vbCIsInJvbGVzIjpbIlNDSE9PTF9BRE1JTiJdLCJzY2hvb2xJZCI6IjQyYWFiZDc4LWVlNjMtNDg2OS05ZjdjLTM1MTUxMjZmOGY3MiIsInNjaG9vbENvZGUiOiJFU0MwMDIiLCJpYXQiOjE3OTMyOTI1OTMsImV4cCI6MTc5MzI5NjE5M30.oj0ZE5k8aCzrUUAWDN9JN4RdRuU7DcEQfFOuwG0iwek";
const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhODRlNjA0OC05MTNmLTQzMTAtYjRkYy0xZTQyODUyNzY0ZjciLCJ1c2VybmFtZSI6ImFkbWluLnNjaG9vbCIsInJvbGVzIjpbIlNDSE9PTF9BRE1JTiJdLCJzY2hvb2xJZCI6IjQyYWFiZDc4LWVlNjMtNDg2OS05ZjdjLTM1MTUxMjZmOGY3MiIsInNjaG9vbENvZGUiOiJFU0MwMDIiLCJpYXQiOjE3OTMyOTI1OTMsImV4cCI6MTc5Mzg5NzM5M30.8ONngy1eLUvADujSEdWR6kf9wjK77-M1YxJgolUYI6g";

const authStorage = JSON.stringify({
  state: {
    accessToken: token,
    refreshToken: refreshToken,
    user: {
      sub: "a84e6048-913f-4310-b4dc-1e42852764f7",
      publicId: "a84e6048-913f-4310-b4dc-1e42852764f7",
      username: "admin.school",
      firstName: "Juan",
      lastName: "Perez",
      roles: ["SCHOOL_ADMIN"],
      schoolId: "42aabd78-ee63-4869-9f7c-3515126f8f72",
      schoolCode: "ESC002"
    },
    isAuthenticated: true
  },
  version: 0
});

const scenario = {
  browser: {
    mode: "launch",
    executable_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  },
  start_url: {
    url: "http://localhost:3000/school/finance"
  },
  storage: {
    cookies: [
      {
        name: "token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax"
      }
    ],
    local_storage: [
      {
        origin: "http://localhost:3000",
        key: "auth-storage",
        value: authStorage
      }
    ]
  },
  capture: {
    at_end: ["url", "screenshot"],
    network: {
      request_body: false,
      response_body: false,
      header_values: false
    }
  },
  actions: [
    {
      step_id: "wait-finance-load",
      action: "wait_for_timeout",
      duration_ms: 4000
    },
    {
      step_id: "click-defaulters-tab",
      action: "click",
      locator: {
        kind: "css",
        selector: "button:has-text('Gestión de Morosos')"
      },
      timeout_ms: 15000
    },
    {
      step_id: "wait-defaulters-tab",
      action: "wait_for_timeout",
      duration_ms: 3000
    }
  ]
};

fs.writeFileSync('C:/Users/Kevin Mejia/.gemini/antigravity/brain/1c9591f6-4383-47d1-a22a-51187f29f72c/scratch/test_finance_scenario.json', JSON.stringify(scenario, null, 2));
console.log('Saved test_finance_scenario.json');

