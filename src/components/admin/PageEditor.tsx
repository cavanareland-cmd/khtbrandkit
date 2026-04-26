import { useMemo, useState } from "react";
import { useCmsPage, upsertSection, deleteSection, type CmsSection } from "@/hooks/useCmsSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Save, ChevronUp, ChevronDown, Loader2, X } from "lucide-react";
import { toast } from "sonner";

type Props = { pageSlug: string };

const PageEditor = ({ pageSlug }: Props) => {
  const { sections, loading, refresh } = useCmsPage(pageSlug);

  // Group sections by section_key
  const grouped = useMemo(() => {
    const map = new Map<string, CmsSection[]>();
    for (const s of sections) {
      const arr = map.get(s.section_key) ?? [];
      arr.push(s);
      map.set(s.section_key, arr);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      items: items.sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [sections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 text-sm text-foreground/75">
          <strong className="text-primary">Tip:</strong> Klik pada section untuk membukanya. Setiap blok bisa diedit, diatur urutan, ditampilkan/disembunyikan, atau dihapus. Setiap perubahan langsung tampil di halaman publik.
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={grouped.length ? [grouped[0].key] : []} className="space-y-3">
        {grouped.map((g) => (
          <AccordionItem key={g.key} value={g.key} className="border rounded-lg bg-card overflow-hidden">
            <AccordionTrigger className="px-5 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <span className="font-display text-lg font-bold capitalize text-secondary">
                  {g.key.replace(/_/g, " ")}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {g.items.length} blok
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 space-y-4">
              {g.items.map((item, idx) => (
                <BlockEditor
                  key={item.id}
                  section={item}
                  isFirst={idx === 0}
                  isLast={idx === g.items.length - 1}
                  onChange={refresh}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const last = g.items[g.items.length - 1];
                  await upsertSection(null, {
                    page_slug: pageSlug,
                    section_key: g.key,
                    block_key: `item-${Date.now()}`,
                    label: "Blok baru",
                    content: last ? { ...last.content } : {},
                    sort_order: (last?.sort_order ?? 0) + 1,
                  });
                  refresh();
                  toast.success("Blok ditambahkan");
                }}
              >
                <Plus className="h-4 w-4" /> Tambah blok ke "{g.key}"
              </Button>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

/* ============= BLOCK EDITOR ============= */
const BlockEditor = ({
  section,
  isFirst,
  isLast,
  onChange,
}: {
  section: CmsSection;
  isFirst: boolean;
  isLast: boolean;
  onChange: () => void;
}) => {
  const [content, setContent] = useState<Record<string, unknown>>(section.content ?? {});
  const [label, setLabel] = useState(section.label ?? "");
  const [visible, setVisible] = useState(section.is_visible);
  const [saving, setSaving] = useState(false);
  const dirty =
    JSON.stringify(content) !== JSON.stringify(section.content) ||
    label !== (section.label ?? "") ||
    visible !== section.is_visible;

  const setField = (key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    const ok = await upsertSection(section.id, { content, label, is_visible: visible });
    setSaving(false);
    if (ok) {
      toast.success("Tersimpan");
      onChange();
    }
  };

  const move = async (dir: -1 | 1) => {
    const ok = await upsertSection(section.id, { sort_order: section.sort_order + dir * 1.5 });
    if (ok) onChange();
  };

  const remove = async () => {
    if (!confirm(`Hapus blok "${label || section.block_key}"?`)) return;
    const ok = await deleteSection(section.id);
    if (ok) {
      toast.success("Dihapus");
      onChange();
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-background space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b">
        <div className="flex-1 min-w-0">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label blok"
            className="h-8 font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Switch checked={visible} onCheckedChange={setVisible} id={`v-${section.id}`} />
            <Label htmlFor={`v-${section.id}`} className="text-xs">
              {visible ? "Tampil" : "Sembunyi"}
            </Label>
          </div>
          <Button size="icon" variant="ghost" onClick={() => move(-1)} disabled={isFirst} className="h-8 w-8">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => move(1)} disabled={isLast} className="h-8 w-8">
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={remove} className="h-8 w-8 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Field editor */}
      <div className="grid sm:grid-cols-2 gap-3">
        {Object.entries(content).map(([key, value]) => (
          <FieldEditor
            key={key}
            fieldKey={key}
            value={value}
            onChange={(v) => setField(key, v)}
            onRemove={() => {
              const next = { ...content };
              delete next[key];
              setContent(next);
            }}
          />
        ))}
      </div>

      {/* Add field + save */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <AddFieldInline onAdd={(k, v) => setField(k, v)} />
        <div className="flex-1" />
        <Button onClick={save} disabled={!dirty || saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
      </div>
    </div>
  );
};

/* ============= FIELD EDITOR ============= */
const FieldEditor = ({
  fieldKey,
  value,
  onChange,
  onRemove,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (v: unknown) => void;
  onRemove: () => void;
}) => {
  const isArray = Array.isArray(value);
  const isString = typeof value === "string";
  const isNumber = typeof value === "number";
  const isBool = typeof value === "boolean";
  const long = isString && (value as string).length > 80;
  const className = `space-y-1 ${isArray || long ? "sm:col-span-2" : ""}`;

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-mono text-muted-foreground">{fieldKey}</Label>
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
          title="Hapus field"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {isArray ? (
        <ListField items={value as string[]} onChange={(arr) => onChange(arr)} />
      ) : isBool ? (
        <Switch checked={value as boolean} onCheckedChange={onChange} />
      ) : isNumber ? (
        <Input
          type="number"
          value={value as number}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ) : long ? (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
};

const ListField = ({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) => (
  <div className="space-y-1.5">
    {items.map((it, i) => (
      <div key={i} className="flex gap-1.5">
        <Input
          value={it}
          onChange={(e) => {
            const next = [...items];
            next[i] = e.target.value;
            onChange(next);
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(items.filter((_, j) => j !== i))}
          className="text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ))}
    <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
      <Plus className="h-3.5 w-3.5" /> Tambah item
    </Button>
  </div>
);

const AddFieldInline = ({ onAdd }: { onAdd: (key: string, value: unknown) => void }) => {
  const [key, setKey] = useState("");
  const [type, setType] = useState<"text" | "list">("text");
  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="nama_field"
        className="h-8 w-36 text-xs"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "text" | "list")}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
      >
        <option value="text">Text</option>
        <option value="list">List</option>
      </select>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          if (!key.trim()) return;
          onAdd(key.trim(), type === "list" ? [] : "");
          setKey("");
        }}
      >
        <Plus className="h-3.5 w-3.5" /> Field
      </Button>
    </div>
  );
};

export default PageEditor;
