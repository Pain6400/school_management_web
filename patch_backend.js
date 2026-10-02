const fs = require('fs');

const servicePath = '../school_management_api/src/modules/users/users.service.ts';
let serviceCode = fs.readFileSync(servicePath, 'utf8');
serviceCode = serviceCode.replace('findAll() {', 
`findTeachers() {
        return this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'roles')
            .leftJoinAndSelect('user.school', 'school')
            .where('roles.code = :code', { code: 'TEACHER' })
            .getMany();
    }

    findAll() {`);
fs.writeFileSync(servicePath, serviceCode);

const controllerPath = '../school_management_api/src/modules/users/users.controller.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf8');
controllerCode = controllerCode.replace('@Get()', 
`@Get('role/teachers')
    @ApiOperation({ summary: 'Get all teachers' })
    @ApiResponse({ status: 200, description: 'Return all teachers.', type: [User] })
    async findTeachers() {
        try {
            const data = await this.usersService.findTeachers();
            return { status: true, message: 'Teachers retrieved successfully', data };
        } catch (error) {
            return { status: false, message: \`Error retrieving teachers: \${error.message}\`, data: null };
        }
    }

    @Get()`);
fs.writeFileSync(controllerPath, controllerCode);

console.log("Successfully patched backend.");
