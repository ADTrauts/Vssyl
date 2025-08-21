"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function seedLocationData() {
    return __awaiter(this, void 0, void 0, function () {
        var usa, uk, canada, germany, nyRegion, caRegion, txRegion, englandRegion, scotlandRegion, ontarioRegion, bavariaRegion, manhattanTown, brooklynTown, losAngelesTown, sanFranciscoTown, houstonTown, londonTown, edinburghTown, torontoTown, munichTown, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌍 Seeding location data...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 27, 28, 30]);
                    // Clear existing data
                    return [4 /*yield*/, prisma.userSerial.deleteMany()];
                case 2:
                    // Clear existing data
                    _a.sent();
                    return [4 /*yield*/, prisma.town.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.region.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.country.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.country.upsert({
                            where: { phoneCode: '1' },
                            update: {},
                            create: {
                                name: 'United States',
                                phoneCode: '1'
                            }
                        })];
                case 6:
                    usa = _a.sent();
                    return [4 /*yield*/, prisma.country.upsert({
                            where: { phoneCode: '44' },
                            update: {},
                            create: {
                                name: 'United Kingdom',
                                phoneCode: '44'
                            }
                        })];
                case 7:
                    uk = _a.sent();
                    return [4 /*yield*/, prisma.country.upsert({
                            where: { phoneCode: '1-CA' },
                            update: {},
                            create: {
                                name: 'Canada',
                                phoneCode: '1-CA'
                            }
                        })];
                case 8:
                    canada = _a.sent();
                    return [4 /*yield*/, prisma.country.upsert({
                            where: { phoneCode: '49' },
                            update: {},
                            create: {
                                name: 'Germany',
                                phoneCode: '49'
                            }
                        })];
                case 9:
                    germany = _a.sent();
                    console.log('✅ Countries created');
                    return [4 /*yield*/, prisma.region.upsert({
                            where: { countryId_code: { countryId: usa.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'New York',
                                code: '001',
                                countryId: usa.id
                            }
                        })];
                case 10:
                    nyRegion = _a.sent();
                    return [4 /*yield*/, prisma.region.upsert({
                            where: { countryId_code: { countryId: usa.id, code: '002' } },
                            update: {},
                            create: {
                                name: 'California',
                                code: '002',
                                countryId: usa.id
                            }
                        })];
                case 11:
                    caRegion = _a.sent();
                    return [4 /*yield*/, prisma.region.upsert({
                            where: { countryId_code: { countryId: usa.id, code: '003' } },
                            update: {},
                            create: {
                                name: 'Texas',
                                code: '003',
                                countryId: usa.id
                            }
                        })];
                case 12:
                    txRegion = _a.sent();
                    return [4 /*yield*/, prisma.region.upsert({
                            where: { countryId_code: { countryId: uk.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'England',
                                code: '001',
                                countryId: uk.id
                            }
                        })];
                case 13:
                    englandRegion = _a.sent();
                    return [4 /*yield*/, prisma.region.upsert({
                            where: { countryId_code: { countryId: uk.id, code: '002' } },
                            update: {},
                            create: {
                                name: 'Scotland',
                                code: '002',
                                countryId: uk.id
                            }
                        })];
                case 14:
                    scotlandRegion = _a.sent();
                    return [4 /*yield*/, prisma.region.upsert({
                            where: { countryId_code: { countryId: canada.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'Ontario',
                                code: '001',
                                countryId: canada.id
                            }
                        })];
                case 15:
                    ontarioRegion = _a.sent();
                    return [4 /*yield*/, prisma.region.upsert({
                            where: { countryId_code: { countryId: germany.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'Bavaria',
                                code: '001',
                                countryId: germany.id
                            }
                        })];
                case 16:
                    bavariaRegion = _a.sent();
                    console.log('✅ Regions created');
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: nyRegion.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'Manhattan',
                                code: '001',
                                regionId: nyRegion.id
                            }
                        })];
                case 17:
                    manhattanTown = _a.sent();
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: nyRegion.id, code: '002' } },
                            update: {},
                            create: {
                                name: 'Brooklyn',
                                code: '002',
                                regionId: nyRegion.id
                            }
                        })];
                case 18:
                    brooklynTown = _a.sent();
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: caRegion.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'Los Angeles',
                                code: '001',
                                regionId: caRegion.id
                            }
                        })];
                case 19:
                    losAngelesTown = _a.sent();
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: caRegion.id, code: '002' } },
                            update: {},
                            create: {
                                name: 'San Francisco',
                                code: '002',
                                regionId: caRegion.id
                            }
                        })];
                case 20:
                    sanFranciscoTown = _a.sent();
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: txRegion.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'Houston',
                                code: '001',
                                regionId: txRegion.id
                            }
                        })];
                case 21:
                    houstonTown = _a.sent();
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: englandRegion.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'London',
                                code: '001',
                                regionId: englandRegion.id
                            }
                        })];
                case 22:
                    londonTown = _a.sent();
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: scotlandRegion.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'Edinburgh',
                                code: '001',
                                regionId: scotlandRegion.id
                            }
                        })];
                case 23:
                    edinburghTown = _a.sent();
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: ontarioRegion.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'Toronto',
                                code: '001',
                                regionId: ontarioRegion.id
                            }
                        })];
                case 24:
                    torontoTown = _a.sent();
                    return [4 /*yield*/, prisma.town.upsert({
                            where: { regionId_code: { regionId: bavariaRegion.id, code: '001' } },
                            update: {},
                            create: {
                                name: 'Munich',
                                code: '001',
                                regionId: bavariaRegion.id
                            }
                        })];
                case 25:
                    munichTown = _a.sent();
                    console.log('✅ Towns created');
                    // Create UserSerial records for each town
                    return [4 /*yield*/, prisma.userSerial.createMany({
                            data: [
                                { townId: manhattanTown.id, lastSerial: 0 },
                                { townId: brooklynTown.id, lastSerial: 0 },
                                { townId: losAngelesTown.id, lastSerial: 0 },
                                { townId: sanFranciscoTown.id, lastSerial: 0 },
                                { townId: houstonTown.id, lastSerial: 0 },
                                { townId: londonTown.id, lastSerial: 0 },
                                { townId: edinburghTown.id, lastSerial: 0 },
                                { townId: torontoTown.id, lastSerial: 0 },
                                { townId: munichTown.id, lastSerial: 0 },
                            ],
                            skipDuplicates: true
                        })];
                case 26:
                    // Create UserSerial records for each town
                    _a.sent();
                    console.log('✅ UserSerial records created');
                    console.log('🎉 Location data seeding completed successfully!');
                    console.log('\n📊 Sample Block IDs that will be generated:');
                    console.log('USA-NY-Manhattan: 001-001-001-0000001');
                    console.log('USA-NY-Brooklyn:  001-001-002-0000001');
                    console.log('USA-CA-LA:        001-002-001-0000001');
                    console.log('UK-England-London: 044-001-001-0000001');
                    console.log('Germany-Bavaria-Munich: 049-001-001-0000001');
                    return [3 /*break*/, 30];
                case 27:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding location data:', error_1);
                    throw error_1;
                case 28: return [4 /*yield*/, prisma.$disconnect()];
                case 29:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 30: return [2 /*return*/];
            }
        });
    });
}
seedLocationData();
