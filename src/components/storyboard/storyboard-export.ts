import type { StoryboardShot } from "@/types";
import { SHOT_SIZES, CAMERA_MOVEMENTS } from "@/types";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

// ============================================
// Lookup helpers
// ============================================
function shotSizeLabel(value: string): string {
  return SHOT_SIZES.find((s) => s.value === value)?.label || value;
}
function cameraLabel(value: string): string {
  return CAMERA_MOVEMENTS.find((c) => c.value === value)?.label || value;
}

// ============================================
// Excel Export
// ============================================
export async function exportStoryboardExcel(
  shots: StoryboardShot[],
  projectName: string
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("分镜表");

  // Columns
  sheet.columns = [
    { header: "镜号", key: "shotNumber", width: 6 },
    { header: "时间", key: "duration", width: 8 },
    { header: "景别", key: "shotSize", width: 10 },
    { header: "摄影机运动", key: "cameraMovement", width: 12 },
    { header: "画面内容", key: "visualDesc", width: 30 },
    { header: "人物动作", key: "action", width: 20 },
    { header: "台词/旁白", key: "dialogue", width: 25 },
    { header: "场景", key: "scene", width: 15 },
    { header: "道具", key: "props", width: 15 },
    { header: "音效", key: "soundEffect", width: 15 },
    { header: "备注", key: "notes", width: 20 },
  ];

  // Header style
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1C1917" },
  };
  headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  headerRow.height = 28;
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Data rows
  shots.forEach((shot) => {
    sheet.addRow({
      shotNumber: shot.shotNumber,
      duration: shot.duration,
      shotSize: shotSizeLabel(shot.shotSize),
      cameraMovement: cameraLabel(shot.cameraMovement),
      visualDesc: shot.visualDesc,
      action: shot.action,
      dialogue: shot.dialogue,
      scene: shot.scene,
      props: shot.props,
      soundEffect: shot.soundEffect,
      notes: shot.notes,
    });
  });

  // Style data rows
  sheet.eachRow((row, rowNum) => {
    if (rowNum > 1) {
      row.height = 50;
      row.alignment = { vertical: "top", wrapText: true };
      row.eachCell((cell, colNum) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  // Alternating row colors
  sheet.eachRow((row, rowNum) => {
    if (rowNum > 1 && rowNum % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F8F6" },
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${projectName}_分镜表.xlsx`);
}

// ============================================
// Word Export
// ============================================
export async function exportStoryboardWord(
  shots: StoryboardShot[],
  projectName: string
) {
  const rows: TableRow[] = [];

  // Header row
  const headers = ["镜号", "时间", "景别", "运镜", "画面内容", "人物动作", "台词/旁白", "场景", "道具", "音效", "备注"];
  rows.push(
    new TableRow({
      children: headers.map(
        (h) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: h, bold: true, size: 18, font: "Microsoft YaHei" })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: "1C1917" },
            width: { size: 1000, type: WidthType.DXA },
          })
      ),
    })
  );

  // Data rows
  shots.forEach((shot) => {
    const values = [
      String(shot.shotNumber),
      shot.duration,
      shotSizeLabel(shot.shotSize),
      cameraLabel(shot.cameraMovement),
      shot.visualDesc,
      shot.action,
      shot.dialogue,
      shot.scene,
      shot.props,
      shot.soundEffect,
      shot.notes,
    ];

    rows.push(
      new TableRow({
        children: values.map(
          (v) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: v, size: 18, font: "Microsoft YaHei" })],
                }),
              ],
              width: { size: 1000, type: WidthType.DXA },
            })
        ),
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `${projectName} - 分镜表`,
                bold: true,
                size: 32,
                font: "Microsoft YaHei",
              }),
            ],
            spacing: { after: 300 },
          }),
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `${projectName}_分镜表.docx`);
}
