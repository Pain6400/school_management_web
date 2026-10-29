const { Client } = require('pg');
const c = new Client({
  host: '129.146.102.231',
  port: 5432,
  user: 'postgres',
  password: '6400',
  database: 'school_managment',
});

async function main() {
  await c.connect();
  const res = await c.query(`
    SELECT c.code, c.name, c.school_code, c.grade_code, c.course_code, c.classroom_code, c.teacher_id, c.schedule,
           u.first_name as teacher_first_name, u.last_name as teacher_last_name,
           cr.name as classroom_name,
           g.name as grade_name,
           co.name as course_name
    FROM classes c
    LEFT JOIN users u ON u.public_id = c.teacher_id
    LEFT JOIN classrooms cr ON cr.code = c.classroom_code AND cr.school_code = c.school_code
    LEFT JOIN grades g ON g.code = c.grade_code AND g.school_code = c.school_code
    LEFT JOIN courses co ON co.code = c.course_code AND co.school_code = c.school_code
    WHERE c.school_code = 'ESC002'
    ORDER BY c.code
  `);
  console.log(`Found ${res.rows.length} classes for ESC002:`);
  console.log(JSON.stringify(res.rows, null, 2));
  await c.end();
}

main().catch(console.error);

