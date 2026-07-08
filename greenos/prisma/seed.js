import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODULES = [
    { moduleKey: "attendance", displayName: "Attendance", description: "Time & attendance tracking", routePath: "/modules/attendance", icon: "clock", enabled: true, sortOrder: 1 },
    { moduleKey: "crm", displayName: "CRM", description: "Customer relationship management", routePath: "/modules/crm", icon: "users", enabled: false, sortOrder: 2 },
    { moduleKey: "tms", displayName: "TMS", description: "Transportation management", routePath: "/modules/tms", icon: "truck", enabled: false, sortOrder: 3 },
    { moduleKey: "hr", displayName: "HR", description: "Human resources", routePath: "/modules/hr", icon: "badge", enabled: false, sortOrder: 4 },
    { moduleKey: "dispatch", displayName: "Dispatch", description: "Load dispatch operations", routePath: "/modules/dispatch", icon: "route", enabled: false, sortOrder: 5 },
    { moduleKey: "accounting", displayName: "Accounting", description: "Finance & billing", routePath: "/modules/accounting", icon: "ledger", enabled: false, sortOrder: 6 },
    { moduleKey: "ai", displayName: "AI Assistant", description: "Internal AI tools", routePath: "/modules/ai", icon: "spark", enabled: false, sortOrder: 7 },
    { moduleKey: "portal", displayName: "Customer Portal", description: "External customer access", routePath: "/modules/portal", icon: "globe", enabled: false, sortOrder: 8 },
];

async function main() {
    for (const role of [
        ["Administrator", "Full system access"],
        ["Owner", "Company owner — full access"],
        ["Manager", "Operational management"],
        ["Viewer", "Read only access"],
    ]) {
        await prisma.role.upsert({
            where: { roleName: role[0] },
            update: {},
            create: { roleName: role[0], description: role[1] },
        });
    }

    const ownerRole = await prisma.role.findUnique({ where: { roleName: "Owner" } });
    const adminRole = await prisma.role.findUnique({ where: { roleName: "Administrator" } });

    for (const mod of MODULES) {
        await prisma.platformModule.upsert({
            where: { moduleKey: mod.moduleKey },
            update: mod,
            create: mod,
        });
    }

    const dayShift = await prisma.shift.upsert({
        where: { shiftName: "Day Shift" },
        update: {},
        create: {
            shiftName: "Day Shift",
            startTime: "08:00",
            endTime: "17:00",
            gracePeriodMinutes: 15,
            crossMidnight: false,
        },
    });

    await prisma.shift.upsert({
        where: { shiftName: "Night Shift" },
        update: {},
        create: {
            shiftName: "Night Shift",
            startTime: "00:00",
            endTime: "05:00",
            gracePeriodMinutes: 15,
            crossMidnight: false,
        },
    });

    const passwordHash = await bcrypt.hash("Admin123!@Green", 12);
    await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            passwordHash,
            firstName: "System",
            lastName: "Administrator",
            email: "admin@greengrouplogistics.com",
            roleId: adminRole.roleId,
        },
    });

    await prisma.user.upsert({
        where: { username: "owner" },
        update: {},
        create: {
            username: "owner",
            passwordHash,
            firstName: "Green",
            lastName: "Owner",
            email: "owner@greengrouplogistics.com",
            roleId: ownerRole.roleId,
        },
    });

    const settings = [
        ["attendance", "grace_period_minutes", "15", "Grace period before late"],
        ["dashboard", "refresh_interval_seconds", "5", "Dashboard refresh interval"],
        ["application", "timezone", "America/Los_Angeles", "Company timezone"],
        ["application", "company_name", "Green Logistics", "Company name"],
        ["security", "jwt_expiration_hours", "8", "JWT lifetime"],
        ["legacy", "auto_sync", "false", "Auto sync cards to access device"],
    ];

    for (const [category, key, value, description] of settings) {
        await prisma.setting.upsert({
            where: { category_settingKey: { category, settingKey: key } },
            update: { settingValue: value },
            create: { category, settingKey: key, settingValue: value, description },
        });
    }

    console.log("Green OS seed completed.");
    console.log("Owner login: owner / Admin123!@Green");
    console.log("Admin login: admin / Admin123!@Green");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
