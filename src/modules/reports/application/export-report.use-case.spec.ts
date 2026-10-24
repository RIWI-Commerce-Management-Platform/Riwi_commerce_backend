import { describe, expect, it, vi } from 'vitest';
import { ExportReportUseCase } from './export-report.use-case.js';
import { toCsv, UTF8_BOM } from './csv.js';
import { UserRole } from '../../auth/domain/user-role.enum.js';

describe('toCsv', () => {
  it('starts with a BOM, uses CRLF and escapes special cells', () => {
    const csv = toCsv(
      ['Name', 'Note'],
      [
        ['Ñandú "Ltda"', 'a,b'],
        [null, 'line\nbreak'],
      ],
    );

    expect(csv.startsWith(UTF8_BOM)).toBe(true);
    expect(csv.slice(1)).toBe(
      'Name,Note\r\n"Ñandú ""Ltda""","a,b"\r\n,"line\nbreak"\r\n',
    );
  });

  it('supports a semicolon separator', () => {
    expect(toCsv(['A', 'B'], [['x;y', 2]], ';').slice(1)).toBe(
      'A;B\r\n"x;y";2\r\n',
    );
  });

  it('neutralizes cells that Excel would run as formulas', () => {
    expect(toCsv(['A'], [['=SUM(A1)']]).slice(1)).toBe("A\r\n'=SUM(A1)\r\n");
  });

  it('formats dates and booleans', () => {
    const date = new Date('2026-10-20T15:00:00.000Z');
    expect(toCsv(['D', 'B'], [[date, true]]).slice(1)).toBe(
      'D,B\r\n2026-10-20T15:00:00.000Z,true\r\n',
    );
  });
});

describe('ExportReportUseCase', () => {
  const dao = {
    findVisits: vi.fn().mockResolvedValue([
      {
        id: 1,
        scheduledAt: new Date('2026-10-20T14:00:00.000Z'),
        status: 'VISITED',
        advisorName: 'Laura',
        clientNit: '900',
        clientName: 'Tienda',
        zoneName: 'Soledad',
        actualDate: '2026-10-20',
        startTime: '09:00:00',
        endTime: '09:30:00',
        results: 'Sale',
        observations: null,
        quoteGenerated: true,
        orderGenerated: false,
      },
    ]),
    findClients: vi.fn().mockResolvedValue([]),
    findQuotes: vi.fn().mockResolvedValue([]),
    findOrders: vi.fn().mockResolvedValue([]),
  };
  const today = new Date('2026-10-24T12:00:00.000Z');

  it('exports the visits with headers and a dated filename', async () => {
    const useCase = new ExportReportUseCase(dao as any);

    const report = await useCase.execute('visits', {}, undefined, ',', today);

    expect(report.filename).toBe('visits-2026-10-24.csv');
    const [header, row] = report.content.slice(1).split('\r\n');
    expect(header.startsWith('Visit ID,Scheduled at,Status')).toBe(true);
    expect(row).toContain('Laura');
    expect(row).toContain('true,false');
  });

  it('limits a regional director to their zone', async () => {
    const useCase = new ExportReportUseCase(dao as any);

    await useCase.execute(
      'quotes',
      { zoneId: 9, status: 'APPROVED' },
      { id: 2, role: UserRole.DIRECTOR_REGIONAL, zoneId: 3 },
      ',',
      today,
    );

    expect(dao.findQuotes).toHaveBeenCalledWith({
      zoneId: 3,
      status: 'APPROVED',
    });
  });

  it.each(['clients', 'orders'] as const)('exports %s', async (type) => {
    const useCase = new ExportReportUseCase(dao as any);

    const report = await useCase.execute(type, {}, undefined, ';', today);

    expect(report.filename).toBe(`${type}-2026-10-24.csv`);
    expect(report.content.split('\r\n')[0]).toContain(';');
  });
});
