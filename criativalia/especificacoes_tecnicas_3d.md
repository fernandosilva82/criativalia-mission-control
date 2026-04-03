# 🖨️ ESPECIFICAÇÕES TÉCNICAS 3D - Criativalia
## Arquivos de Configuração para Impressão Otimizada

---

## 📐 MODELOS 3D - ESPECIFICAÇÕES

### ARANDELAS LINHA ATUAL (Atualização Recomendada)

#### Arandela Minimalista Slim
```yaml
Nome arquivo: arandela_slim_v2.3mf
Dimensões: 180 x 80 x 60 mm (L x A x P)
Volume: 125 cm³
Peso estimado: 140g (PLA+)

Configurações Otimizadas:
  Layer height: 0.2mm
  Walls: 3 perimeters (1.2mm total)
  Top/Bottom: 4 layers
  Infill: Gyroid 20%
  Supports: Tree (raios curvos inferiores)
  Print speed: 150mm/s
  
Tempo estimado: 2h 45min (vs 3h 50min padrão)
Custo material: R$ 6,30 (vs R$ 8,90 padrão)
Economia: -29%
```

#### Arandela Orgânica Wave
```yaml
Nome arquivo: arandela_onda_organica_v1.3mf
Dimensões: 200 x 120 x 85 mm
Volume: 210 cm³
Peso estimado: 235g (PLA+)

Configurações Otimizadas:
  Layer height: 0.16mm (mais qualidade para curvas)
  Walls: 3 perimeters variáveis
    - Zona fixação: 4 perimeters
    - Corpo ondulado: 2 perimeters
  Top/Bottom: 5 layers
  Infill: Gyroid 18% (zona central), 25% (fixação)
  Supports: Tree (agressivo nas ondas)
  Ironing: ON (superfície superior visível)
  
Tempo estimado: 4h 15min (vs 6h padrão)
Custo material: R$ 10,50 (vs R$ 15,00 padrão)
Economia: -30%
```

---

## 🆕 NOVOS PRODUTOS - MODELOS 3D

### PRODUTO 1: ECLIPSE PEDESTAL

```yaml
Nome arquivo: eclipse_pedestal_v1.3mf
SKU sugerido: CR-ECL-001

COMPONENTES SEPARADOS:
  1_base:
    arquivo: eclipse_base.3mf
    dimensoes: 250 x 250 x 30 mm
    volume: 420 cm³
    peso: 470g
    material: PLA+ ou PETG (resistência)
    infill: Gyroid 25%
    walls: 4 perimeters (base pesada)
    tempo: 5h 30min
    
  2_haste:
    arquivo: eclipse_haste.3mf
    dimensoes: 30 x 30 x 1200 mm (em 2 partes)
    volume: 180 cm³ por parte
    peso: 200g por parte
    material: PLA+ (rígido)
    infill: Gyroid 30% (hollow interno para passagem fio)
    walls: 3 perimeters
    tempo: 2h por parte
    
  3_cabeca:
    arquivo: eclipse_cabeca.3mf
    dimensoes: 150 x 150 x 80 mm
    volume: 280 cm³
    peso: 310g
    material: PLA+ ou PLA Silk
    infill: Gyroid 15%
    walls: 2 perimeters (visual)
    tempo: 3h 30min
    
  4_difusor:
    arquivo: eclipse_difusor.3mf
    dimensoes: 140 x 140 x 40 mm
    volume: 120 cm³
    peso: 85g
    material: PLA Translúcido
    infill: 0% (peça oca)
    walls: 3 perimeters (0.9mm)
    layer_height: 0.12mm
    tempo: 1h 45min

TOTAL:
  peso: ~1265g
  tempo: ~14h 30min (impressão paralela recomendada)
  custo material: ~R$ 57
  
HARDWARE NECESSÁRIO:
  - Haste roscada M8 x 1000mm (ajuste altura)
  - Porcas M8 x 4 unidades
  - E27 socket com fiação
  - Rodízios opcionais (base)
  - Pintura spray opcional
```

### PRODUTO 2: NIMBUS PENDENTE MODULAR

```yaml
Nome arquivo: nimbus_modulo_base_v1.3mf
SKU sugerido: CR-NMB-001 (módulo único)

MÓDULO ÚNICO:
  dimensoes: 150 x 150 x 120 mm
  volume: 165 cm³
  peso: 185g
  material: PLA+ ou PLA Silk
  
  Configurações:
    layer_height: 0.2mm
    walls: 2 perimeters (0.8mm) - visual
    top/bottom: 3 layers
    infill: Gyroid 12% (leveza máxima)
    supports: Tree (conexão interna)
    ironing: ON (exterior)
    tempo: 2h 15min
    custo: R$ 4,20
    
CONEXÃO MAGNÉTICA:
  arquivo: nimbus_conector_mag.3mf
  dimensoes: 25 x 25 x 15 mm
  quantidade: 2 por módulo
  peso: 8g cada
  infill: 100% (peça pequena estrutural)
  tempo: 12min cada
  
KIT RECOMENDADO (3 módulos):
  - 3x módulos base
  - 6x conectores magnéticos
  - 1m cabo têxtil
  - Canopla de teto
  Peso total: ~600g
  Tempo total: ~7h (impressão sequencial)
  Custo: ~R$ 22
  
VARIAÇÕES:
  - CR-NMB-002: Kit 5 módulos (~R$ 35)
  - CR-NMB-COR: Cores personalizadas (+R$ 5)
```

### PRODUTO 3: AURA ABAJUR WIRELESS

```yaml
Nome arquivo: aura_abajur_v1.3mf
SKU sugerido: CR-AUR-001

COMPONENTES:
  1_base_wireless:
    arquivo: aura_base.3mf
    dimensoes: 120 x 120 x 45 mm
    volume: 180 cm³
    peso: 200g
    material: PLA+ (resistente, base pesada)
    infill: Gyroid 25%
    walls: 4 perimeters
    tempo: 2h 30min
    
  2_cupula_externa:
    arquivo: aura_cupula_ext.3mf
    dimensoes: 200 x 200 x 150 mm
    volume: 85 cm³ (estrutura vazada)
    peso: 95g
    material: PLA ou PLA Wood
    infill: 0% (apenas paredes)
    walls: 2 perimeters
    layer_height: 0.16mm
    tempo: 2h
    
  3_difusor_interno:
    arquivo: aura_difusor.3mf
    dimensoes: 180 x 180 x 80 mm
    volume: 95 cm³
    peso: 70g
    material: PLA Translúcido Natural
    infill: Gyroid 10%
    walls: 2 perimeters
    tempo: 1h 30min
    
  4_botao_touch:
    arquivo: aura_botao.3mf
    dimensoes: 20 x 20 x 8 mm
    peso: 3g
    infill: 100%
    tempo: 8min

TOTAL:
  peso: ~368g
  tempo: ~6h 10min
  custo: ~R$ 16,50
  
ELETRÔNICA INTEGRADA:
  - Módulo Qi 15W (base)
  - LED 3000K 8W integrado
  - Controlador touch capacitivo
  - Fonte 12V 2A inclusa
  
INSTRUÇÕES MONTAGEM:
  1. Instalar módulo Qi na base (encaixe pressão)
  2. Passar fiação pela haste interna
  3. Conectar LED ao controlador
  4. Encaixar cúpula (rotação 360°)
  5. Colar botão touch na base
```

---

## ⚙️ PERFIS DE IMPRESSÃO PRESET

### Perfil: CRIATIVALIA_QUALIDADE

```ini
; OrcaSlicer/Bambu Studio Profile
; Para produtos finais acabamento premium

layer_height = 0.16
wall_loops = 3
top_shell_layers = 4
bottom_shell_layers = 4
sparse_infill_density = 20%
sparse_infill_pattern = gyroid
infill_anchor = 2
infill_combination = 0

seam_position = aligned
wall_sequence = inner-outer-inner
brim_type = auto
brim_width = 5

support_type = tree(auto)
tree_support_branch_angle = 45
tree_support_wall_count = 2

ironing_type = top
ironing_flow = 10%
ironing_speed = 20mm/s

default_acceleration = 5000
inner_wall_acceleration = 4000
outer_wall_acceleration = 2000
top_surface_acceleration = 2000

outer_wall_speed = 120mm/s
inner_wall_speed = 200mm/s
top_surface_speed = 80mm/s
infill_speed = 200mm/s
support_speed = 150mm/s

enable_pressure_advance = 1
pressure_advance = 0.02
```

### Perfil: CRIATIVALIA_RAPIDO

```ini
; Para protótipos e testes
; Economia de tempo mantendo qualidade aceitável

layer_height = 0.28
wall_loops = 2
top_shell_layers = 3
bottom_shell_layers = 3
sparse_infill_density = 15%
sparse_infill_pattern = gyroid

support_type = tree(auto)
ironing_type = none

outer_wall_speed = 150mm/s
inner_wall_speed = 250mm/s
top_surface_speed = 100mm/s
infill_speed = 250mm/s

default_acceleration = 8000
```

### Perfil: CRIATIVALIA_TRANSLUCIDO

```ini
; Especifico para difusores e peças translúcidas

layer_height = 0.12
wall_loops = 2
spiral_mode = 0 (desligado para estrutura)
top_shell_layers = 3
bottom_shell_layers = 3
sparse_infill_density = 10%
sparse_infill_pattern = gyroid

ironing_type = top
ironing_flow = 8%

outer_wall_speed = 80mm/s
inner_wall_speed = 120mm/s

; Material: PLA Translúcido Natural
; Temperatura: 200°C (5° a menos que padrão)
; Cooling: 100% a partir da camada 2
```

---

## 🎨 PALETA DE FILAMENTOS OFICIAL

### Cores Base (Estoque Constante)

| SKU Filamento | Cor | HEX | Fornecedor | Custo/kg | Aplicação |
|---------------|-----|-----|------------|----------|-----------|
| FL-TER-001 | Terracota Natural | #D4A574 | 3D Prime | R$ 85 | Arandelas, bases |
| FL-SAL-001 | Sálvia Mate | #8B9A7C | 3D Prime | R$ 85 | Linha completa |
| FL-AVL-001 | Avelã Claro | #C9B8A7 | Voolt | R$ 90 | Abajures |
| FL-ONS-001 | Osso Natural | #E8E3D9 | 3D Prime | R$ 80 | Bases, acabamentos |
| FL-CAR-001 | Carvão Fosco | #4A4A4A | 3D Prime | R$ 85 | Moderno |
| FL-TRA-001 | Translúcido Natural | - | 3D Prime | R$ 95 | Difusores |

### Cores Especiais (Encomenda/Premium)

| SKU Filamento | Cor | Acabamento | Custo/kg | Aplicação |
|---------------|-----|------------|----------|-----------|
| FL-SLK-COB | Cobre Silk | Metálico brilhante | R$ 120 | Detalhes luxo |
| FL-SLK-OUR | Ouro Silk | Metálico brilhante | R$ 120 | Detalhes luxo |
| FL-WOD-CAR | Wood Carvalho | Textura madeira | R$ 110 | Natural/orgânico |
| FL-MAR-001 | Mármore | Efeito pedra | R$ 115 | Sofisticação |

---

## 📊 TABELA DE CUSTOS OTIMIZADOS

### Custos por Produto (Matéria-prima apenas)

| Produto | Peso | Custo Base | Custo Otimizado | Economia |
|---------|------|------------|-----------------|----------|
| Arandela Slim | 140g | R$ 8,90 | R$ 6,30 | -29% |
| Arandela Orgânica | 235g | R$ 15,00 | R$ 10,50 | -30% |
| Eclipse Pedestal | 1265g | R$ 80,00 | R$ 57,00 | -29% |
| Nimbus (3 mód) | 600g | R$ 32,00 | R$ 22,00 | -31% |
| Aura Abajur | 368g | R$ 22,00 | R$ 16,50 | -25% |

### Custo Total de Produção Estimado

```
Fórmula:
Custo Total = (Custo Material × 1.15) + (Tempo × R$ 2/h) + Overhead

Onde:
- 1.15 = fator desperdício/falhas (15%)
- R$ 2/h = custo energia + amortização
- Overhead = embalagem, etiquetas (R$ 2-5)
```

| Produto | Custo Material | Custo Energia | Overhead | Custo Total | Sugestão Venda | Margem |
|---------|---------------|---------------|----------|-------------|----------------|--------|
| Arandela Slim | R$ 6,30 | R$ 5,50 | R$ 3,00 | R$ 14,80 | R$ 49,90 | 70% |
| Arandela Orgânica | R$ 10,50 | R$ 8,50 | R$ 4,00 | R$ 23,00 | R$ 79,90 | 71% |
| Eclipse Pedestal | R$ 57,00 | R$ 29,00 | R$ 8,00 | R$ 94,00 | R$ 299,00 | 69% |
| Nimbus (3 mód) | R$ 22,00 | R$ 14,00 | R$ 5,00 | R$ 41,00 | R$ 149,90 | 73% |
| Aura Abajur | R$ 16,50 | R$ 12,00 | R$ 5,00 | R$ 33,50 | R$ 119,90 | 72% |

---

## 🔧 CHECKLIST DE PRÉ-PRODUÇÃO

### Para Cada Nova Peça

```
□ Modelo 3D revisado (sem erros de mesh)
□ Orientação otimizada para impressão
□ Suportes configurados (Tree quando possível)
□ Infill Gyroid 15-25%
□ Paredes variáveis aplicadas
□ Teste de impressão realizado
□ Tempo cronometrado e documentado
□ Custo calculado
□ Fotos de amostra tiradas
□ Qualidade validada (resistência/acabamento)
```

### Documentação de Lote

```yaml
Lote: CR-2026-04-001
Produto: Arandela Slim - Terracota
Quantidade: 10 unidades

Configurações:
  impressora: Bambu A1 Mini #1
  perfil: CRIATIVALIA_QUALIDADE
  filamento: FL-TER-001 (Lote F-240315)
  
Tempos:
  configuracao: 15min
  impressao_total: 27h 30min
  pos_processamento: 2h
  
Custos:
  material: R$ 63,00
  energia: R$ 55,00
  mao_obra: R$ 40,00
  total: R$ 158,00
  custo_unitario: R$ 15,80
  
Resultados:
  unidades_boas: 10
  falhas: 0
  taxa_sucesso: 100%
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
/criativalia/
├── /modelos_3d/
│   ├── /arandelas/
│   │   ├── arandela_slim_v2.3mf
│   │   ├── arandela_onda_organica_v1.3mf
│   │   └── arandela_articulada_v1.3mf
│   ├── /pendentes/
│   │   ├── nimbus_modulo_base_v1.3mf
│   │   └── nimbus_conector_mag.3mf
│   ├── /abajures/
│   │   ├── aura_base.3mf
│   │   ├── aura_cupula_ext.3mf
│   │   └── aura_difusor.3mf
│   └── /pedestais/
│       ├── eclipse_base.3mf
│       ├── eclipse_haste.3mf
│       ├── eclipse_cabeca.3mf
│       └── eclipse_difusor.3mf
├── /perfis/
│   ├── CRIATIVALIA_QUALIDADE.json
│   ├── CRIATIVALIA_RAPIDO.json
│   └── CRIATIVALIA_TRANSLUCIDO.json
├── /docs/
│   ├── designbot_briefing_2026.md
│   └── especificacoes_tecnicas_3d.md (este arquivo)
└── /producao/
    └── registro_lotes.yaml
```

---

*Documento técnico gerado pelo DesignBot da Criativalia*
*Atualizado: 03/04/2026*
*Versão: 1.0*
