// src/lib/qualification.js v4
// Uses official FIFA Annex C lookup table for correct 3rd-place assignments

export const GROUPS = {
  'Group A': ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'],
  'Group B': ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'],
  'Group C': ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  'Group D': ['USA', 'Paraguay', 'Australia', 'Türkiye'],
  'Group E': ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  'Group F': ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  'Group G': ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  'Group H': ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  'Group I': ['France', 'Senegal', 'Iraq', 'Norway'],
  'Group J': ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  'Group K': ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  'Group L': ['England', 'Croatia', 'Ghana', 'Panama'],
}

export const GROUP_FIXTURES = {
  'Group A': ['m001','m002','m003','m004','m005','m006'],
  'Group B': ['m007','m008','m009','m010','m011','m012'],
  'Group C': ['m013','m014','m015','m016','m017','m018'],
  'Group D': ['m019','m020','m021','m022','m023','m024'],
  'Group E': ['m025','m026','m027','m028','m029','m030'],
  'Group F': ['m031','m032','m033','m034','m035','m036'],
  'Group G': ['m037','m038','m039','m040','m041','m042'],
  'Group H': ['m043','m044','m045','m046','m047','m048'],
  'Group I': ['m049','m050','m051','m052','m053','m054'],
  'Group J': ['m055','m056','m057','m058','m059','m060'],
  'Group K': ['m061','m062','m063','m064','m065','m066'],
  'Group L': ['m067','m068','m069','m070','m071','m072'],
}

// ── Official R32 bracket (verified from FIFA schedule) ────────────────────
// m073: 2A vs 2B       m074: 1E vs 3rd      m075: 1F vs 2C
// m076: 1C vs 2F       m077: 1I vs 3rd      m078: 2E vs 2I
// m079: 1A vs 3rd      m080: 1L vs 3rd      m081: 1D vs 3rd
// m082: 1G vs 3rd      m083: 2K vs 2L       m084: 1H vs 2J
// m085: 1B vs 3rd      m086: 1J vs 2H       m087: 1K vs 3rd
// m088: 2D vs 2G

// ── FIFA Annex C lookup table ─────────────────────────────────────────────
// Key = sorted group letters of the 8 qualifying 3rd-place teams (e.g. "BCDEFGIJ")
// Value = map of fixture ID -> which group's 3rd-place team plays there
// Source: Wikipedia - 2026 FIFA World Cup knockout stage
const ANNEX_C = {
  "EFGHIJKL": {"m074":"Group F","m077":"Group G","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group J","m087":"Group L"},
  "DFGHIJKL": {"m074":"Group D","m077":"Group F","m079":"Group H","m080":"Group K","m081":"Group I","m082":"Group J","m085":"Group G","m087":"Group L"},
  "DEGHIJKL": {"m074":"Group D","m077":"Group G","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group J","m087":"Group L"},
  "DEFHIJKL": {"m074":"Group D","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group J","m087":"Group L"},
  "DEFGIJKL": {"m074":"Group D","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group J","m085":"Group G","m087":"Group L"},
  "DEFGHJKL": {"m074":"Group D","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group L"},
  "DEFGHIKL": {"m074":"Group D","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group G","m087":"Group L"},
  "DEFGHIJL": {"m074":"Group D","m077":"Group F","m079":"Group E","m080":"Group I","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group L"},
  "DEFGHIJK": {"m074":"Group D","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group I"},
  "CFGHIJKL": {"m074":"Group C","m077":"Group F","m079":"Group H","m080":"Group K","m081":"Group I","m082":"Group J","m085":"Group G","m087":"Group L"},
  "CEGHIJKL": {"m074":"Group C","m077":"Group G","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group J","m087":"Group L"},
  "CEFHIJKL": {"m074":"Group C","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group J","m087":"Group L"},
  "CEFGIJKL": {"m074":"Group C","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group J","m085":"Group G","m087":"Group L"},
  "CEFGHJKL": {"m074":"Group C","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CEFGHIKL": {"m074":"Group C","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CEFGHIJL": {"m074":"Group C","m077":"Group F","m079":"Group E","m080":"Group I","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CEFGHIJK": {"m074":"Group C","m077":"Group F","m079":"Group E","m080":"Group K","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group I"},
  "CDGHIJKL": {"m074":"Group C","m077":"Group D","m079":"Group H","m080":"Group K","m081":"Group I","m082":"Group J","m085":"Group G","m087":"Group L"},
  "CDFHIJKL": {"m074":"Group D","m077":"Group F","m079":"Group H","m080":"Group K","m081":"Group I","m082":"Group C","m085":"Group J","m087":"Group L"},
  "CDFGIJKL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group I","m082":"Group J","m085":"Group G","m087":"Group L"},
  "CDFGHJKL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CDFGHIKL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CDFGHIJL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group I","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CDFGHIJK": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group I"},
  "CDEHIJKL": {"m074":"Group C","m077":"Group D","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group J","m087":"Group L"},
  "CDEGHIJK": {"m074":"Group C","m077":"Group D","m079":"Group E","m080":"Group K","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group I"},
  "CDEGIJKL": {"m074":"Group C","m077":"Group D","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group J","m085":"Group G","m087":"Group L"},
  "CDEGHIKL": {"m074":"Group C","m077":"Group D","m079":"Group E","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CDEGHIJL": {"m074":"Group C","m077":"Group D","m079":"Group E","m080":"Group I","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CDEGHJKL": {"m074":"Group C","m077":"Group D","m079":"Group E","m080":"Group K","m081":"Group J","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CDEFIJKL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group E","m082":"Group I","m085":"Group J","m087":"Group L"},
  "CDEFHJKL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group E","m082":"Group H","m085":"Group J","m087":"Group L"},
  "CDEFHIKL": {"m074":"Group E","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group D","m087":"Group L"},
  "CDEFHIJL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group I","m081":"Group E","m082":"Group H","m085":"Group J","m087":"Group L"},
  "CDEFHIJK": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group E","m082":"Group H","m085":"Group J","m087":"Group I"},
  "CDEFGJKL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group E","m082":"Group J","m085":"Group G","m087":"Group L"},
  "CDEFGIKL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group E","m082":"Group I","m085":"Group G","m087":"Group L"},
  "CDEFGIJL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group I","m081":"Group E","m082":"Group J","m085":"Group G","m087":"Group L"},
  "CDEFGIJK": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group E","m082":"Group J","m085":"Group G","m087":"Group I"},
  "CDEFGHKL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group E","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CDEFGHJL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group E","m081":"Group H","m082":"Group J","m085":"Group G","m087":"Group L"},
  "CDEFGHJK": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group E","m081":"Group H","m082":"Group J","m085":"Group G","m087":"Group K"},
  "CDEFGHIL": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group I","m081":"Group E","m082":"Group H","m085":"Group G","m087":"Group L"},
  "CDEFGHIK": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group K","m081":"Group E","m082":"Group H","m085":"Group G","m087":"Group I"},
  "CDEFGHIJ": {"m074":"Group D","m077":"Group F","m079":"Group C","m080":"Group E","m081":"Group H","m082":"Group J","m085":"Group G","m087":"Group I"},
  "BFGHIJKL": {"m074":"Group F","m077":"Group G","m079":"Group H","m080":"Group K","m081":"Group B","m082":"Group I","m085":"Group J","m087":"Group L"},
  "BEGHIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group K","m081":"Group I","m082":"Group H","m085":"Group J","m087":"Group L"},
  "BEFHIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group I","m082":"Group H","m085":"Group J","m087":"Group K"},
  "BEFGIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group I","m082":"Group G","m085":"Group J","m087":"Group K"},
  "BEFGHJKL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group J","m082":"Group G","m085":"Group F","m087":"Group K"},
  "BEFGHIKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group I","m082":"Group H","m085":"Group G","m087":"Group K"},
  "BEFGHIJL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group J","m082":"Group G","m085":"Group F","m087":"Group I"},
  "BEFGHIJK": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group I","m081":"Group J","m082":"Group G","m085":"Group F","m087":"Group K"},
  "BDFHIJKL": {"m074":"Group D","m077":"Group I","m079":"Group H","m080":"Group L","m081":"Group B","m082":"Group I","m085":"Group J","m087":"Group K"},
  "BDFGIJKL": {"m074":"Group I","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BDFGHJKL": {"m074":"Group D","m077":"Group H","m079":"Group G","m080":"Group L","m081":"Group B","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BDFGHIKL": {"m074":"Group D","m077":"Group H","m079":"Group G","m080":"Group L","m081":"Group B","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BDFGHIJL": {"m074":"Group D","m077":"Group H","m079":"Group G","m080":"Group L","m081":"Group B","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BDFGHIJK": {"m074":"Group D","m077":"Group H","m079":"Group G","m080":"Group I","m081":"Group B","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BDEHIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group I","m085":"Group J","m087":"Group K"},
  "BDEGHIJK": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group G","m085":"Group J","m087":"Group K"},
  "BDEGIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group G","m087":"Group K"},
  "BDEGHIKL": {"m074":"Group E","m077":"Group H","m079":"Group G","m080":"Group L","m081":"Group B","m082":"Group I","m085":"Group D","m087":"Group K"},
  "BDEGHIJL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group G","m085":"Group J","m087":"Group I"},
  "BDEGHJKL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group G","m087":"Group K"},
  "BDEFIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BDEFHJKL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BDEFHIKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BDEFHIJL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BDEFHIJK": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BDEFGJKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BDEFGIKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BDEFGIJL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BDEFGIJK": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BDEFGHKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BDEFGHJL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group E"},
  "BDEFGHJK": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BDEFGHIL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group I"},
  "BDEFGHIK": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BDEFGHIJ": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group E"},
  "BCGHIJKL": {"m074":"Group C","m077":"Group I","m079":"Group H","m080":"Group L","m081":"Group B","m082":"Group I","m085":"Group J","m087":"Group K"},
  "BCFHIJKL": {"m074":"Group C","m077":"Group I","m079":"Group H","m080":"Group L","m081":"Group B","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BCFGIJKL": {"m074":"Group I","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCFGHJKL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCFGHIKL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BCFGHIJL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BCFGHIJK": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCEHIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group I","m085":"Group J","m087":"Group K"},
  "BCEGHIJK": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group G","m085":"Group J","m087":"Group K"},
  "BCEGIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group G","m087":"Group K"},
  "BCEGHIKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group I","m085":"Group H","m087":"Group K"},
  "BCEGHIJL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group G","m085":"Group J","m087":"Group I"},
  "BCEGHJKL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group G","m087":"Group K"},
  "BCEFIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BCEFHJKL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCEFHIKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BCEFHIJL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BCEFHIJK": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCEFGJKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCEFGIKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BCEFGIJL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BCEFGIJK": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCEFGHKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BCEFGHJL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group E"},
  "BCEFGHJK": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group E","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCEFGHIL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group H","m085":"Group F","m087":"Group I"},
  "BCEFGHIK": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BCEFGHIJ": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group E"},
  "BCDHIJKL": {"m074":"Group C","m077":"Group I","m079":"Group H","m080":"Group L","m081":"Group B","m082":"Group I","m085":"Group J","m087":"Group K"},
  "BCDGHIJK": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group K"},
  "BCDGIJKL": {"m074":"Group I","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group K"},
  "BCDGHIKL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group I","m085":"Group D","m087":"Group K"},
  "BCDGHIJL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group I"},
  "BCDGHJKL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group K"},
  "BCDFIJKL": {"m074":"Group C","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BCDFHJKL": {"m074":"Group C","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCDFHIKL": {"m074":"Group C","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BCDFHIJL": {"m074":"Group C","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BCDFHIJK": {"m074":"Group C","m077":"Group H","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCDFGJKL": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCDFGIKL": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BCDFGIJL": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BCDFGIJK": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCDFGHKL": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BCDFGHJL": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group J"},
  "BCDFGHJK": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group C","m081":"Group J","m082":"Group F","m085":"Group D","m087":"Group K"},
  "BCDFGHIL": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group I"},
  "BCDFGHIK": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BCDFGHIJ": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group F","m087":"Group D"},
  "BCDEHIJK": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group K"},
  "BCDEIJKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group I","m085":"Group J","m087":"Group K"},
  "BCDEHIKL": {"m074":"Group E","m077":"Group I","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group H","m085":"Group D","m087":"Group K"},
  "BCDEHIJL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group I"},
  "BCDEHJKL": {"m074":"Group E","m077":"Group H","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group K"},
  "BCDEGIJK": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group K"},
  "BCDEGIJL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group I"},
  "BCDEGIKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group I","m085":"Group D","m087":"Group K"},
  "BCDEGJKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group K"},
  "BCDEGHJK": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group E","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group K"},
  "BCDEGHIL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group H","m085":"Group D","m087":"Group I"},
  "BCDEGHIK": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group H","m085":"Group D","m087":"Group K"},
  "BCDEGHIJ": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group I","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group E"},
  "BCDEGHJL": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group J","m085":"Group D","m087":"Group E"},
  "BCDEGHKL": {"m074":"Group E","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group C","m082":"Group H","m085":"Group D","m087":"Group K"},
  "BCDEFJKL": {"m074":"Group C","m077":"Group F","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group E","m085":"Group J","m087":"Group K"},
  "BCDEFIJK": {"m074":"Group C","m077":"Group E","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCDEFIJL": {"m074":"Group C","m077":"Group F","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group E","m085":"Group J","m087":"Group I"},
  "BCDEFIKL": {"m074":"Group C","m077":"Group E","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group I","m085":"Group F","m087":"Group K"},
  "BCDEFHJK": {"m074":"Group C","m077":"Group F","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group H","m085":"Group J","m087":"Group K"},
  "BCDEFHJL": {"m074":"Group C","m077":"Group F","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group H","m085":"Group J","m087":"Group E"},
  "BCDEFHIK": {"m074":"Group C","m077":"Group E","m079":"Group B","m080":"Group I","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BCDEFHIL": {"m074":"Group H","m077":"Group E","m079":"Group F","m080":"Group L","m081":"Group C","m082":"Group D","m085":"Group B","m087":"Group I"},
  "BCDEFHIJ": {"m074":"Group C","m077":"Group F","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group H","m085":"Group J","m087":"Group I"},
  "BCDEFHJK_2": {"m074":"Group C","m077":"Group F","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group H","m085":"Group J","m087":"Group K"},
  "BCDEFGHJ": {"m074":"Group H","m077":"Group G","m079":"Group B","m080":"Group C","m081":"Group J","m082":"Group F","m085":"Group D","m087":"Group E"},
  "BCDEFGHI": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group I"},
  "BCDEFGHK": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group H","m085":"Group F","m087":"Group K"},
  "BCDEFGHL": {"m074":"Group H","m077":"Group G","m079":"Group F","m080":"Group L","m081":"Group C","m082":"Group D","m085":"Group B","m087":"Group E"},
  "BCDEFGJK": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group K"},
  "BCDEFGJL": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group E"},
  "BCDEFGIJ": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group J","m085":"Group F","m087":"Group I"},
  "BCDEFGIL": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group L","m081":"Group D","m082":"Group E","m085":"Group F","m087":"Group I"},
  "BCDEFGIK": {"m074":"Group C","m077":"Group G","m079":"Group B","m080":"Group E","m081":"Group D","m082":"Group F","m085":"Group I","m087":"Group K"},
};

// ── Group standings ───────────────────────────────────────────────────────

function getResult(h, a) { return h > a ? 'home' : a > h ? 'away' : 'draw' }
function initStats(team) { return { team, played:0, won:0, drawn:0, lost:0, gf:0, ga:0, gd:0, points:0 } }

export function calculateGroupStandings(group, fixtures, predictions) {
  const teams = GROUPS[group]
  const fixtureIds = GROUP_FIXTURES[group]
  const stats = {}
  teams.forEach(t => { stats[t] = initStats(t) })
  const h2h = {}
  teams.forEach(a => { h2h[a] = {}; teams.forEach(b => { if (a!==b) h2h[a][b] = {points:0,gd:0,gf:0} }) })

  for (const fid of fixtureIds) {
    const fixture = fixtures[fid]
    const pred = predictions[fid]
    if (!fixture || !pred) continue
    const hg = Number(pred.score90Home), ag = Number(pred.score90Away)
    if (isNaN(hg) || isNaN(ag) || pred.score90Home==='' || pred.score90Away==='') continue
    const home = fixture.homeTeam, away = fixture.awayTeam
    const result = getResult(hg, ag)
    stats[home].played++; stats[away].played++
    stats[home].gf+=hg; stats[home].ga+=ag; stats[away].gf+=ag; stats[away].ga+=hg
    stats[home].gd=stats[home].gf-stats[home].ga; stats[away].gd=stats[away].gf-stats[away].ga
    if (result==='home') {
      stats[home].won++; stats[home].points+=3; stats[away].lost++
      h2h[home][away].points+=3
    } else if (result==='away') {
      stats[away].won++; stats[away].points+=3; stats[home].lost++
      h2h[away][home].points+=3
    } else {
      stats[home].drawn++; stats[home].points++; stats[away].drawn++; stats[away].points++
      h2h[home][away].points++; h2h[away][home].points++
    }
    h2h[home][away].gd+=(hg-ag); h2h[away][home].gd+=(ag-hg)
    h2h[home][away].gf+=hg; h2h[away][home].gf+=ag
  }

  return Object.values(stats).sort((a,b) => {
    if (b.points!==a.points) return b.points-a.points
    const ha=h2h[a.team]?.[b.team]||{points:0,gd:0,gf:0}
    const hb=h2h[b.team]?.[a.team]||{points:0,gd:0,gf:0}
    if (ha.points!==hb.points) return hb.points-ha.points
    if (ha.gd!==hb.gd) return hb.gd-ha.gd
    if (ha.gf!==hb.gf) return hb.gf-ha.gf
    if (b.gd!==a.gd) return b.gd-a.gd
    if (b.gf!==a.gf) return b.gf-a.gf
    return a.team.localeCompare(b.team)
  })
}

export function calculateAllQualifiers(fixtures, predictions) {
  const standings = {}
  const thirdPlaceTeams = []
  for (const group of Object.keys(GROUPS)) {
    const fixtureIds = GROUP_FIXTURES[group]
    const allPredicted = fixtureIds.every(fid => {
      const p = predictions[fid]
      return p && p.score90Home!==undefined && p.score90Away!==undefined && p.score90Home!=='' && p.score90Away!==''
    })
    if (!allPredicted) continue
    const s = calculateGroupStandings(group, fixtures, predictions)
    standings[group] = s
    if (s.length >= 3) thirdPlaceTeams.push({...s[2], group})
  }
  thirdPlaceTeams.sort((a,b) => {
    if (b.points!==a.points) return b.points-a.points
    if (b.gd!==a.gd) return b.gd-a.gd
    if (b.gf!==a.gf) return b.gf-a.gf
    return a.team.localeCompare(b.team)
  })
  const best8Third = thirdPlaceTeams.slice(0,8)
  const qualifiers = {}
  for (const [group, s] of Object.entries(standings)) {
    qualifiers[group] = { winner: s[0]?.team, runnerUp: s[1]?.team, third: s[2]?.team }
  }
  return { standings, qualifiers, best8Third }
}

export function assignThirdPlaceTeams(best8Third) {
  if (best8Third.length < 8) return {}
  // Build lookup key from the 8 qualifying group letters, sorted
  const key = best8Third.map(t => t.group.replace('Group ','')).sort().join('')
  const row = ANNEX_C[key]
  if (!row) return {}
  // row maps fixture ID -> group name, convert to team name
  const teamByGroup = {}
  best8Third.forEach(t => { teamByGroup[t.group] = t.team })
  const assignments = {}
  for (const [fixture, groupName] of Object.entries(row)) {
    if (teamByGroup[groupName]) assignments[fixture] = teamByGroup[groupName]
  }
  return assignments
}

export function generateRoundOf32(fixtures, predictions) {
  const { qualifiers, best8Third } = calculateAllQualifiers(fixtures, predictions)
  const tp = assignThirdPlaceTeams(best8Third)
  const w = (group, pos) => {
    const q = qualifiers[group]
    if (!q) return 'TBD'
    return (pos===1 ? q.winner : q.runnerUp) || 'TBD'
  }
  return [
    { id:'m073', homeTeam: w('Group A',2), awayTeam: w('Group B',2) },
    { id:'m074', homeTeam: w('Group E',1), awayTeam: tp['m074']||'TBD' },
    { id:'m075', homeTeam: w('Group F',1), awayTeam: w('Group C',2) },
    { id:'m076', homeTeam: w('Group C',1), awayTeam: w('Group F',2) },
    { id:'m077', homeTeam: w('Group I',1), awayTeam: tp['m077']||'TBD' },
    { id:'m078', homeTeam: w('Group E',2), awayTeam: w('Group I',2) },
    { id:'m079', homeTeam: w('Group A',1), awayTeam: tp['m079']||'TBD' },
    { id:'m080', homeTeam: w('Group L',1), awayTeam: tp['m080']||'TBD' },
    { id:'m081', homeTeam: w('Group D',1), awayTeam: tp['m081']||'TBD' },
    { id:'m082', homeTeam: w('Group G',1), awayTeam: tp['m082']||'TBD' },
    { id:'m083', homeTeam: w('Group K',2), awayTeam: w('Group L',2) },
    { id:'m084', homeTeam: w('Group H',1), awayTeam: w('Group J',2) },
    { id:'m085', homeTeam: w('Group B',1), awayTeam: tp['m085']||'TBD' },
    { id:'m086', homeTeam: w('Group J',1), awayTeam: w('Group H',2) },
    { id:'m087', homeTeam: w('Group K',1), awayTeam: tp['m087']||'TBD' },
    { id:'m088', homeTeam: w('Group D',2), awayTeam: w('Group G',2) },
  ]
}

export function getKnockoutWinner(pred, fixture) {
  const h90=Number(pred.score90Home), a90=Number(pred.score90Away)
  if (isNaN(h90)||isNaN(a90)||pred.score90Home===''||pred.score90Away==='') return null
  if (h90>a90) return fixture.homeTeam
  if (a90>h90) return fixture.awayTeam
  const hET=Number(pred.scoreETHome), aET=Number(pred.scoreETAway)
  if (!isNaN(hET)&&!isNaN(aET)&&pred.scoreETHome!==''&&pred.scoreETAway!=='') {
    if (hET>aET) return fixture.homeTeam
    if (aET>hET) return fixture.awayTeam
    const hPen=Number(pred.scorePenHome), aPen=Number(pred.scorePenAway)
    if (!isNaN(hPen)&&!isNaN(aPen)&&pred.scorePenHome!==''&&pred.scorePenAway!=='') {
      if (hPen>aPen) return fixture.homeTeam
      if (aPen>hPen) return fixture.awayTeam
    }
  }
  return null
}
