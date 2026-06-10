# Memory Index

- [runWithTenant await inside](runwithtenant-await-inside.md) — db ops phải await BÊN TRONG runWithTenant nếu không mất cô lập tenant (fail-closed throw)
- [create needs explicit tenantId](create-needs-explicit-tenantid.md) — db.*.create phải truyền tenantId tường minh cho TS; extension vẫn ghi đè
