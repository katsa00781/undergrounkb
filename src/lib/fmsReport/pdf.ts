import {
  FMS_CORRECTION_MODALITY_LABELS,
  type FMSCorrectionExercise,
} from '../workoutGenerator/fmsCorrections';
import { FMS_REPORT_COLORS, getScoreColor } from './constants';
import { REPORT_FONT_FAMILY, arrayBufferToBase64, loadReportFonts, registerReportFonts } from './fonts';
import type { FMSReportModel } from './types';

export interface GeneratedReportPdf {
  blob: Blob;
  base64: string;
  filename: string;
}

// A4, milliméterben.
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 16;

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/** 2026-07-31 → 2026. 07. 31. */
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${year}. ${month}. ${day}.` : isoDate;
}

/** Ékezetmentes, ASCII fájlnév — az SMTP header-kódolás így biztosan nem rontja el. */
function buildFilename(model: FMSReportModel): string {
  const slug = model.clientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40);

  return ['fms-riport', slug || 'ugyfel', model.assessmentDate].join('-') + '.pdf';
}

export async function generateFMSReportPdf(model: FMSReportModel): Promise<GeneratedReportPdf> {
  // Dinamikus import: a jsPDF így külön async chunkba kerül, és csak akkor
  // töltődik le, amikor tényleg PDF-et generálunk.
  const [{ jsPDF }, { default: autoTable }, fonts] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadReportFonts(),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  registerReportFonts(doc, fonts);

  const setFont = (style: 'normal' | 'bold', size: number) => {
    doc.setFont(REPORT_FONT_FAMILY, style);
    doc.setFontSize(size);
  };
  const setText = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const setDraw = (hex: string) => doc.setDrawColor(...hexToRgb(hex));

  let cursorY = 0;

  /** Új oldal, ha a következő blokk már nem férne el. */
  const ensureSpace = (needed: number) => {
    if (cursorY + needed > PAGE_HEIGHT - FOOTER_HEIGHT) {
      doc.addPage();
      cursorY = MARGIN;
    }
  };

  // ── Fejléc sáv ────────────────────────────────────────────────────────────
  // A kártya 12 mm-t lóg rá a sávra, ezért a sáv magassága a felirat alatt még
  // hagy helyet: a név/dátum sor (y = 34) így nem kerül a kártya alá.
  const HEADER_HEIGHT = 52;
  setFill(FMS_REPORT_COLORS.primary600);
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');

  setFont('bold', 8);
  setText(FMS_REPORT_COLORS.primary50);
  doc.text('UG KETTLEBELL PRO', MARGIN, 15);

  setFont('bold', 22);
  setText(FMS_REPORT_COLORS.white);
  doc.text('FMS felmérés', MARGIN, 26);

  setFont('normal', 10);
  setText(FMS_REPORT_COLORS.primary50);
  doc.text(
    `${model.clientName}  ·  ${formatDate(model.assessmentDate)}`,
    MARGIN,
    34,
  );

  // ── Összpontszám kártya (a fejlécsávra lógva) ─────────────────────────────
  const CARD_TOP = HEADER_HEIGHT - 12;
  const CARD_HEIGHT = 36;
  setFill(FMS_REPORT_COLORS.white);
  setDraw(FMS_REPORT_COLORS.gray200);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, CARD_TOP, CONTENT_WIDTH, CARD_HEIGHT, 2.5, 2.5, 'FD');

  setFont('bold', 30);
  setText(FMS_REPORT_COLORS.primary600);
  doc.text(String(model.totalScore), MARGIN + 10, CARD_TOP + 21);

  const totalWidth = doc.getTextWidth(String(model.totalScore));
  setFont('normal', 12);
  setText(FMS_REPORT_COLORS.gray400);
  doc.text(`/ ${model.maxScore}`, MARGIN + 12 + totalWidth, CARD_TOP + 21);

  setFont('bold', 7);
  setText(FMS_REPORT_COLORS.gray400);
  doc.text('ÖSSZPONTSZÁM', MARGIN + 10, CARD_TOP + 27.5);

  // Függőleges elválasztó + a sáv értékelése
  const dividerX = MARGIN + 48;
  setDraw(FMS_REPORT_COLORS.gray200);
  doc.line(dividerX, CARD_TOP + 7, dividerX, CARD_TOP + CARD_HEIGHT - 7);

  setFont('bold', 12);
  setText(FMS_REPORT_COLORS.gray900);
  doc.text(model.band.label, dividerX + 8, CARD_TOP + 13);

  setFont('normal', 8);
  setText(FMS_REPORT_COLORS.gray600);
  doc.text(doc.splitTextToSize(model.band.summary, CONTENT_WIDTH - 66), dividerX + 8, CARD_TOP + 19);

  cursorY = CARD_TOP + CARD_HEIGHT + 10;

  // ── Fájdalom-figyelmeztetés ───────────────────────────────────────────────
  if (model.hasPainFlag) {
    const warningLines = doc.splitTextToSize(
      'A felmérés során legalább egy mozgásmintánál fájdalom jelentkezett (0 pont). '
        + 'Ilyenkor az FMS protokoll szerint orvosi kivizsgálás javasolt, és az érintett '
        + 'mozgásminta terhelését kerülni kell a kivizsgálás eredményéig.',
      CONTENT_WIDTH - 14,
    ) as string[];
    const boxHeight = warningLines.length * 4.4 + 10;

    ensureSpace(boxHeight + 6);
    setFill('#FDECEF');
    doc.roundedRect(MARGIN, cursorY, CONTENT_WIDTH, boxHeight, 2, 2, 'F');
    setFill(FMS_REPORT_COLORS.error500);
    doc.rect(MARGIN, cursorY, 1.6, boxHeight, 'F');

    setFont('bold', 9);
    setText(FMS_REPORT_COLORS.error500);
    doc.text('Figyelem', MARGIN + 7, cursorY + 6.5);

    setFont('normal', 8.5);
    setText(FMS_REPORT_COLORS.gray900);
    doc.text(warningLines, MARGIN + 7, cursorY + 11.5);

    cursorY += boxHeight + 8;
  }

  /**
   * Szekciócím vékony aláhúzással. A `needed` a cím alatti első blokk magassága:
   * így a cím nem marad árván a lap alján.
   */
  const sectionTitle = (title: string, needed = 16) => {
    ensureSpace(needed);
    setFont('bold', 13);
    setText(FMS_REPORT_COLORS.gray900);
    doc.text(title, MARGIN, cursorY);
    setDraw(FMS_REPORT_COLORS.primary500);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, cursorY + 2.2, MARGIN + 12, cursorY + 2.2);
    doc.setLineWidth(0.3);
    cursorY += 9;
  };

  // ── Részletes eredmények ──────────────────────────────────────────────────
  sectionTitle('Részletes eredmények');

  autoTable(doc, {
    startY: cursorY,
    margin: { left: MARGIN, right: MARGIN, bottom: FOOTER_HEIGHT },
    head: [['Mozgásminta', 'Pont', 'Értékelés']],
    body: model.rows.map(row => [row.label, `${row.score} / 3`, row.scoreLabel]),
    theme: 'plain',
    styles: {
      font: REPORT_FONT_FAMILY,
      fontStyle: 'normal',
      fontSize: 9.5,
      cellPadding: { top: 3.2, bottom: 3.2, left: 4, right: 4 },
      textColor: hexToRgb(FMS_REPORT_COLORS.gray900),
      lineColor: hexToRgb(FMS_REPORT_COLORS.gray200),
      lineWidth: { bottom: 0.2 },
    },
    headStyles: {
      font: REPORT_FONT_FAMILY,
      fontStyle: 'bold',
      fontSize: 7.5,
      textColor: hexToRgb(FMS_REPORT_COLORS.gray600),
      fillColor: hexToRgb(FMS_REPORT_COLORS.gray50),
      lineWidth: 0,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 52 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      2: { textColor: hexToRgb(FMS_REPORT_COLORS.gray600) },
    },
    didParseCell: data => {
      // A pontszám oszlop a saját sávszínét kapja.
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.textColor = hexToRgb(getScoreColor(model.rows[data.row.index].score));
      }
    },
    willDrawCell: data => {
      // Vékony színjelölő a sor bal szélén.
      if (data.section === 'body' && data.column.index === 0) {
        setFill(getScoreColor(model.rows[data.row.index].score));
        doc.rect(data.cell.x, data.cell.y + 1.6, 1.2, data.cell.height - 3.2, 'F');
      }
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  /** Kétsoros blokk: félkövér cím + tördelt leírás, oldaltörés-figyeléssel. */
  const labelledParagraph = (label: string, body: string, indent = 0) => {
    setFont('normal', 8.5);
    const lines = doc.splitTextToSize(body, CONTENT_WIDTH - indent) as string[];
    ensureSpace(lines.length * 4 + 9);

    setFont('bold', 9.5);
    setText(FMS_REPORT_COLORS.gray900);
    doc.text(label, MARGIN + indent, cursorY);

    setFont('normal', 8.5);
    setText(FMS_REPORT_COLORS.gray600);
    doc.text(lines, MARGIN + indent, cursorY + 4.6);

    cursorY += lines.length * 4 + 8;
  };

  // ── Javasolt korrekciós gyakorlatok ───────────────────────────────────────
  if (model.corrections.length > 0) {
    // Egy korrekciós gyakorlat sora: bal oldalt modalitás-címke, jobbra a
    // gyakorlat neve, alatta az adagolás és a végrehajtási instrukció.
    const BADGE_WIDTH = 25;
    const ROW_INDENT = 5;
    const HEADER_BLOCK = 9;
    const TEXT_X = MARGIN + ROW_INDENT + BADGE_WIDTH + 3;
    const TEXT_WIDTH = CONTENT_WIDTH - (ROW_INDENT + BADGE_WIDTH + 3) - ROW_INDENT;

    /** Előre kiszámolt sortördelés — a kártya magasságát rajzolás előtt ismernünk kell. */
    const layoutRow = (exercise: FMSCorrectionExercise) => {
      setFont('bold', 8.5);
      const nameLines = doc.splitTextToSize(exercise.name, TEXT_WIDTH) as string[];
      setFont('normal', 7.8);
      const detailLines = doc.splitTextToSize(
        `${exercise.dosage} — ${exercise.cue}`,
        TEXT_WIDTH,
      ) as string[];

      return {
        nameLines,
        detailLines,
        height: nameLines.length * 4 + detailLines.length * 3.5 + 3.5,
      };
    };

    // A teljes szekció elrendezése előre: a címnek és a bevezetőnek csak akkor
    // van értelme a lap alján, ha az első kártya is odafér.
    const cards = model.corrections.map(group => {
      const rows = group.exercises.map(layoutRow);

      return {
        group,
        rows,
        height: HEADER_BLOCK + rows.reduce((sum, row) => sum + row.height, 0) + 2,
      };
    });

    setFont('normal', 8.5);
    const intro = doc.splitTextToSize(
      'A 2 pont alatti mozgásmintákhoz az alábbi gyakorlatok beépítése javasolt az edzés '
        + 'bemelegítő és korrekciós blokkjába. Mintánként a teljes sor végigvihető, az '
        + 'SMR-től a terhelt megerősítésig.',
      CONTENT_WIDTH,
    ) as string[];
    const introHeight = intro.length * 4 + 5;

    // A címhez elég a fejléc + egy gyakorlatsor helye: a kártya a lap alján
    // szétvágható, csak árván maradnia nem szabad.
    sectionTitle(
      'Javasolt korrekciós gyakorlatok',
      9 + introHeight + HEADER_BLOCK + cards[0].rows[0].height + 6,
    );

    setFont('normal', 8.5);
    setText(FMS_REPORT_COLORS.gray600);
    doc.text(intro, MARGIN, cursorY);
    cursorY += introHeight;

    cards.forEach(({ group, rows }) => {
      let index = 0;

      // Egy kártya több oldalra is átnyúlhat: minden lapra annyi gyakorlatsor
      // kerül, amennyi elfér, a folytatás pedig új fejlécet kap.
      while (index < rows.length) {
        const available = PAGE_HEIGHT - FOOTER_HEIGHT - cursorY;
        let fragmentHeight = HEADER_BLOCK + 2;
        let fitCount = 0;

        while (
          index + fitCount < rows.length
          && fragmentHeight + rows[index + fitCount].height <= available
        ) {
          fragmentHeight += rows[index + fitCount].height;
          fitCount += 1;
        }

        // Friss lapon mindig legalább egy sort kirakunk, különben végtelen ciklus.
        if (fitCount === 0) {
          if (cursorY > MARGIN) {
            doc.addPage();
            cursorY = MARGIN;
            continue;
          }
          fitCount = 1;
          fragmentHeight += rows[index].height;
        }

        const isContinuation = index > 0;

        setFill(FMS_REPORT_COLORS.gray50);
        doc.roundedRect(MARGIN, cursorY - 4, CONTENT_WIDTH, fragmentHeight, 2, 2, 'F');

        setFont('bold', 9.5);
        setText(FMS_REPORT_COLORS.gray900);
        doc.text(
          isContinuation ? `${group.label} (folytatás)` : group.label,
          MARGIN + ROW_INDENT,
          cursorY + 1,
        );

        if (!isContinuation) {
          setFont('bold', 8);
          setText(getScoreColor(group.score));
          doc.text(`${group.score} pont`, PAGE_WIDTH - MARGIN - ROW_INDENT, cursorY + 1, {
            align: 'right',
          });
        }

        let rowY = cursorY + HEADER_BLOCK - 3;

        rows.slice(index, index + fitCount).forEach((row, offset) => {
          const exercise = group.exercises[index + offset];
          const { nameLines, detailLines, height } = row;

          // Modalitás-címke
          setFill(FMS_REPORT_COLORS.white);
          setDraw(FMS_REPORT_COLORS.gray200);
          doc.roundedRect(MARGIN + ROW_INDENT, rowY - 3.1, BADGE_WIDTH, 4.6, 1, 1, 'FD');
          setFont('bold', 6.4);
          setText(FMS_REPORT_COLORS.primary600);
          doc.text(
            FMS_CORRECTION_MODALITY_LABELS[exercise.modality],
            MARGIN + ROW_INDENT + BADGE_WIDTH / 2,
            rowY,
            { align: 'center' },
          );

          setFont('bold', 8.5);
          setText(FMS_REPORT_COLORS.gray900);
          doc.text(nameLines, TEXT_X, rowY);

          setFont('normal', 7.8);
          setText(FMS_REPORT_COLORS.gray600);
          doc.text(detailLines, TEXT_X, rowY + nameLines.length * 4);

          rowY += height;
        });

        index += fitCount;
        cursorY += fragmentHeight + 6;
      }
    });

    cursorY += 4;
  }

  // ── Tesztleírások ─────────────────────────────────────────────────────────
  sectionTitle('Mit mérnek az egyes tesztek?', 30);
  model.rows.forEach(row => labelledParagraph(row.label, row.description));

  // ── Edzői megjegyzés ──────────────────────────────────────────────────────
  if (model.notes) {
    setFont('normal', 9);
    const noteLines = doc.splitTextToSize(model.notes, CONTENT_WIDTH - 14) as string[];
    const noteHeight = noteLines.length * 4.6 + 10;

    sectionTitle('Edzői megjegyzés', 9 + noteHeight + 4);
    setFont('normal', 9);

    setFill(FMS_REPORT_COLORS.primary50);
    doc.roundedRect(MARGIN, cursorY - 4, CONTENT_WIDTH, noteHeight, 2, 2, 'F');
    setFill(FMS_REPORT_COLORS.primary500);
    doc.rect(MARGIN, cursorY - 4, 1.6, noteHeight, 'F');

    setText(FMS_REPORT_COLORS.gray900);
    doc.text(noteLines, MARGIN + 7, cursorY + 2);
    cursorY += noteHeight + 6;
  }

  // ── Lábléc minden oldalra ─────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  const footerLeft = model.trainerName
    ? `UG Kettlebell Pro  ·  ${model.trainerName}`
    : 'UG Kettlebell Pro';

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setDraw(FMS_REPORT_COLORS.gray200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);

    setFont('normal', 7.5);
    setText(FMS_REPORT_COLORS.gray400);
    doc.text(footerLeft, MARGIN, PAGE_HEIGHT - 7.5);
    doc.text(`${page} / ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 7.5, { align: 'right' });
  }

  const buffer = doc.output('arraybuffer');

  return {
    blob: new Blob([buffer], { type: 'application/pdf' }),
    base64: arrayBufferToBase64(buffer),
    filename: buildFilename(model),
  };
}
