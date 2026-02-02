# SOA System Prompts

## Current Active Prompts

### `main.ts` (46 lines)
Core paraplanner role definition and boundaries. Defines Australian financial advice expertise, compliance requirements, and working principles.

**Usage:** Combined with `soa_concise.ts` for all SOA generation.

### `soa_concise.ts` (115 lines) ✨ **ACTIVE**
Optimized SOA generation prompt. Concise section definitions with clear requirements.

**Features:**
- Complete section list with IDs and basic structure
- Clear data handling rules
- Australian compliance requirements
- Quality checklist
- Token-efficient (80% reduction vs old approach)

**Used by:**
- `app/steps/soa-project.ts` - Main workflow generation
- `app/api/projects/[id]/sections/route.ts` - Add section API
- `app/api/projects/[id]/sections/[sectionId]/regenerate/route.ts` - Regenerate section API

### `soa_batches.ts` ✨ **ACTIVE**
Batch prompts for generating SOA sections in groups. Contains 5 batch prompts that split sections into manageable groups for better context management and parallel processing.

**Used by:**
- `app/steps/soa-project.ts` - Batch generation workflow

## Token Savings

### Current Approach
```
main.ts (46 lines)
+ soa_concise.ts (115 lines)
= 161 lines (~1,300 tokens per request)
```

Previous deprecated prompts (`soa_template.ts` and `soa_structured.ts`) have been removed, saving ~6,700 tokens (84%) per generation request compared to the old approach.

For a typical project with:
- 1 initial generation
- 5 section regenerations
- Total: 6 LLM calls

**Current cost:** ~7,800 input tokens per project

## Migration Complete ✅

All generation code has been updated to use the new concise prompts:
- ✅ `app/steps/soa-project.ts`
- ✅ `app/api/projects/[id]/sections/route.ts`
- ✅ `app/api/projects/[id]/sections/[sectionId]/regenerate/route.ts`

## Future Considerations

### Potential Further Optimizations

1. **Batch Generation**: Split into phases (M1-M4, M5-M7, M8-M10) for better context management
2. **Streaming**: Use `streamObject` for real-time progress updates
3. **Section Templates as Tools**: Use AI SDK tools instead of pure text generation
4. **RAG Integration**: Embed section requirements in vector DB, retrieve only relevant sections

### When to Update Prompts

Update prompts when:
- ASIC regulations change (new required sections)
- Section structure changes
- Compliance requirements change
- Quality issues identified in generation

Keep prompts concise - let the Zod schema handle structure enforcement.
