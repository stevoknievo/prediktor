// src/lib/qualification.js v5
// Complete FIFA Annex C implementation — all 495 combinations
// R32 bracket verified from official FIFA/ESPN schedule

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

// Official R32 bracket (verified from FIFA schedule):
// m073: 2A vs 2B       m074: 1E vs 3rd      m075: 1F vs 2C
// m076: 1C vs 2F       m077: 1I vs 3rd      m078: 2E vs 2I
// m079: 1A vs 3rd      m080: 1L vs 3rd      m081: 1D vs 3rd
// m082: 1G vs 3rd      m083: 2K vs 2L       m084: 1H vs 2J
// m085: 1B vs 3rd      m086: 1J vs 2H       m087: 1K vs 3rd
// m088: 2D vs 2G

// FIFA Annex C - complete 495-row lookup table from official regulations
// Source: 2026 FIFA World Cup knockout stage (Wikipedia / FIFA regulations)
// Key = sorted group letters of the 8 best 3rd-place teams
// Value = fixture ID -> which group's 3rd-place team plays there
const ANNEX_C = {
  "ABCDEFGH": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ABCDEFGI": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCDEFGJ": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCDEFGK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCDEFGL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDEFHI": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group D"},
  "ABCDEFHJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group D"},
  "ABCDEFHK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group D"},
  "ABCDEFHL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group F", "m087":"Group L"},
  "ABCDEFIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABCDEFIK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group I"},
  "ABCDEFIL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ABCDEFJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABCDEFJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDEFKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ABCDEGHI": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCDEGHJ": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCDEGHK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCDEGHL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDEGIJ": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCDEGIK": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCDEGIL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDEGJK": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group J"},
  "ABCDEGJL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDEGKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDEHIJ": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABCDEHIK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group I"},
  "ABCDEHIL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ABCDEHJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABCDEHJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDEHKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ABCDEIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCDEIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDEIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABCDEJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDFGHI": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ABCDFGHJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ABCDFGHK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ABCDFGHL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group H", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDFGIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCDFGIK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCDFGIL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDFGJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group J"},
  "ABCDFGJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDFGKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDFHIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group D"},
  "ABCDFHIK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group F", "m087":"Group I"},
  "ABCDFHIL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group F", "m087":"Group L"},
  "ABCDFHJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group D"},
  "ABCDFHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group H", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDFHKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group F", "m087":"Group L"},
  "ABCDFIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCDFIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDFIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABCDFJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDGHIJ": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCDGHIK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCDGHIL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDGHJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group J"},
  "ABCDGHJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDGHKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDGIJK": {"m074":"Group D", "m077":"Group G", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCDGIJL": {"m074":"Group D", "m077":"Group G", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDGIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCDGJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDHIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCDHIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDHIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABCDHJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCDIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEFGHI": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCEFGHJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCEFGHK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABCEFGHL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCEFGIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCEFGIK": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCEFGIL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCEFGJK": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group J"},
  "ABCEFGJL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCEFGKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCEFHIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABCEFHIK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group I"},
  "ABCEFHIL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ABCEFHJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABCEFHJL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEFHKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ABCEFIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCEFIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEFIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABCEFJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEGHIJ": {"m074":"Group C", "m077":"Group G", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABCEGHIK": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCEGHIL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCEGHJK": {"m074":"Group C", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABCEGHJL": {"m074":"Group C", "m077":"Group G", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEGHKL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCEGIJK": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCEGIJL": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEGIKL": {"m074":"Group A", "m077":"Group C", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "ABCEGJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEHIJK": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCEHIJL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEHIKL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABCEHJKL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCEIJKL": {"m074":"Group A", "m077":"Group C", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "ABCFGHIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCFGHIK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABCFGHIL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCFGHJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group J"},
  "ABCFGHJL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCFGHKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCFGIJK": {"m074":"Group F", "m077":"Group G", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCFGIJL": {"m074":"Group F", "m077":"Group G", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCFGIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCFGJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCFHIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCFHIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCFHIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABCFHJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCFIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCGHIJK": {"m074":"Group C", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABCGHIKL": {"m074":"Group C", "m077":"Group H", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABCGHJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCGIJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABCHIJKL": {"m074":"Group C", "m077":"Group H", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEFGHI": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABDEFGHJ": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABDEFGHK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ABDEFGHL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDEFGIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABDEFGIK": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABDEFGIL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDEFGJK": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group J"},
  "ABDEFGJL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDEFGKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDEFHIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABDEFHIK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group I"},
  "ABDEFHIL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ABDEFHJK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABDEFHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEFHKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ABDEFIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABDEFIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEFIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABDEFJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEGHIJ": {"m074":"Group D", "m077":"Group G", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABDEGHIK": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABDEGHIL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDEGHJK": {"m074":"Group D", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABDEGHJL": {"m074":"Group D", "m077":"Group G", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEGHKL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDEGIJK": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABDEGIJL": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEGIKL": {"m074":"Group A", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "ABDEGJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEHIJK": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABDEHIJL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEHIKL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABDEHJKL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDEIJKL": {"m074":"Group A", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "ABDFGHIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABDFGHIK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABDFGHIL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDFGHJK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group J"},
  "ABDFGHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group J", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDFGHKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDFGIJK": {"m074":"Group D", "m077":"Group G", "m079":"Group F", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABDFGIJL": {"m074":"Group D", "m077":"Group G", "m079":"Group F", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDFGIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDFGJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group F", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDFHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABDFHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDFHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABDFHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDFIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDGHIJK": {"m074":"Group D", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABDGHIJL": {"m074":"Group D", "m077":"Group G", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDGHIKL": {"m074":"Group D", "m077":"Group H", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABDGHJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDGIJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABDHIJKL": {"m074":"Group D", "m077":"Group H", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABEFGHIJ": {"m074":"Group F", "m077":"Group G", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABEFGHIK": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ABEFGHIL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABEFGHJK": {"m074":"Group F", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group E"},
  "ABEFGHJL": {"m074":"Group F", "m077":"Group G", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABEFGHKL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ABEFGIJK": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABEFGIJL": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABEFGIKL": {"m074":"Group A", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "ABEFGJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABEFHIJK": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABEFHIJL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABEFHIKL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group I", "m087":"Group L"},
  "ABEFHJKL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABEFIJKL": {"m074":"Group A", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "ABEGHIJK": {"m074":"Group A", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "ABEGHIJL": {"m074":"Group A", "m077":"Group G", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "ABEGHIKL": {"m074":"Group A", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "ABEGHJKL": {"m074":"Group A", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "ABEGIJKL": {"m074":"Group A", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "ABEHIJKL": {"m074":"Group A", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "ABFGHIJK": {"m074":"Group F", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ABFGHIJL": {"m074":"Group F", "m077":"Group G", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABFGHIKL": {"m074":"Group A", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "ABFGHJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABFGIJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ABFHIJKL": {"m074":"Group A", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "ABGHIJKL": {"m074":"Group A", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "ACDEFGHI": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ACDEFGHJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ACDEFGHK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ACDEFGHL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group E", "m081":"Group F", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEFGIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ACDEFGIK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACDEFGIL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEFGJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ACDEFGJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group E", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEFGKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEFHIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group D"},
  "ACDEFHIK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group F", "m082":"Group A", "m085":"Group E", "m087":"Group I"},
  "ACDEFHIL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group F", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ACDEFHJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group D"},
  "ACDEFHJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group E", "m081":"Group F", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDEFHKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group F", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ACDEFIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ACDEFIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDEFIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ACDEFJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDEGHIJ": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ACDEGHIK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACDEGHIL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEGHJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ACDEGHJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group E", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEGHKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEGIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACDEGIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEGIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEGJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDEHIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ACDEHIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDEHIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ACDEHJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDEIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDFGHIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ACDFGHIK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group F", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACDFGHIL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group F", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDFGHJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group D"},
  "ACDFGHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group H", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDFGHKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group F", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDFGIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACDFGIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDFGIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDFGJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDFHIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group F", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ACDFHIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group F", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDFHIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group F", "m087":"Group L"},
  "ACDFHJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group F", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDFIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACDGHIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACDGHIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDGHIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDGHJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDGIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group I", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACDHIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACEFGHIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ACEFGHIK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACEFGHIL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEFGHJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ACEFGHJL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEFGHKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEFGIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACEFGIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEFGIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEFGJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEFHIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ACEFHIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACEFHIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ACEFHJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACEFIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACEGHIJK": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACEGHIJL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEGHIKL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEGHJKL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACEGIJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACEHIJKL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACFGHIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ACFGHIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACFGHIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACFGHJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACFGIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group I", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ACFHIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACGHIJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ACGHIJLS": {"m074":"Group C", "m077":"Group G", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ADEFGHIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ADEFGHIK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ADEFGHIL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEFGHJK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group E"},
  "ADEFGHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEFGHKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEFGIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ADEFGIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEFGIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEFGJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEFHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group I"},
  "ADEFHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ADEFHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group E", "m087":"Group L"},
  "ADEFHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group E", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ADEFIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ADEGHIJK": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ADEGHIJL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEGHIKL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEGHJKL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADEGIJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ADEHIJKL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ADFGHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "ADFGHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADFGHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADFGHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADFGIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group I", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "ADFHIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "ADGHIJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "AEFGHIJK": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group I"},
  "AEFGHIJL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "AEFGHIKL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "AEFGHJKL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group A", "m085":"Group G", "m087":"Group L"},
  "AEFGIJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "AEFHIJKL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "AEGHIJKL": {"m074":"Group A", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "AFGHIJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group A", "m085":"Group J", "m087":"Group L"},
  "BCDEFGHI": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group E"},
  "BCDEFGHJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group D"},
  "BCDEFGHK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group E"},
  "BCDEFGHL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group E", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BCDEFGIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group E"},
  "BCDEFGIK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group E", "m085":"Group G", "m087":"Group I"},
  "BCDEFGIL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group E", "m085":"Group G", "m087":"Group L"},
  "BCDEFGJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group E"},
  "BCDEFGJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group E", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDEFGKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group E", "m085":"Group G", "m087":"Group L"},
  "BCDEFHIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group E"},
  "BCDEFHIK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group E", "m087":"Group I"},
  "BCDEFHIL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group E", "m087":"Group L"},
  "BCDEFHJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group E"},
  "BCDEFHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group E", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCDEFHKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group E", "m087":"Group L"},
  "BCDEFIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group E", "m085":"Group J", "m087":"Group I"},
  "BCDEFIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group E", "m085":"Group J", "m087":"Group L"},
  "BCDEFIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group E", "m087":"Group L"},
  "BCDEFJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group E", "m085":"Group J", "m087":"Group L"},
  "BCDEGHIJ": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group E"},
  "BCDEGHIK": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "BCDEGHIL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BCDEGHJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group E"},
  "BCDEGHJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDEGHKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BCDEGIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group I"},
  "BCDEGIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDEGIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BCDEGJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDEHIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "BCDEHIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCDEHIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group I", "m087":"Group L"},
  "BCDEHJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCDEIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BCDFGHIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group D"},
  "BCDFGHIK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "BCDFGHIL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BCDFGHJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group D"},
  "BCDFGHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group J", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BCDFGHKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BCDFGIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group I"},
  "BCDFGIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDFGIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BCDFGJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDFHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "BCDFHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCDFHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group I", "m087":"Group L"},
  "BCDFHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCDFIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BCDGHIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group I"},
  "BCDGHIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDGHIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BCDGHJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDGIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCDHIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BCEFGHIJ": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group E"},
  "BCEFGHIK": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "BCEFGHIL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BCEFGHJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group E"},
  "BCEFGHJL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCEFGHKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BCEFGIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group I"},
  "BCEFGIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCEFGIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BCEFGJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCEFHIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "BCEFHIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCEFHIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group I", "m087":"Group L"},
  "BCEFHJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCEFIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BCEGHIJK": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "BCEGHIJL": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCEGHIKL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BCEGHJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BCEGIJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BCEHIJKL": {"m074":"Group C", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BCFGHIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group I"},
  "BCFGHIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCFGHIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BCFGHJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCFGIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BCFHIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BCGHIJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BDEFGHIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group E"},
  "BDEFGHIK": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "BDEFGHIL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BDEFGHJK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group E"},
  "BDEFGHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group E", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BDEFGHKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "BDEFGIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group I"},
  "BDEFGIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BDEFGIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BDEFGJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BDEFHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "BDEFHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BDEFHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group I", "m087":"Group L"},
  "BDEFHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BDEFIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BDEGHIJK": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "BDEGHIJL": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BDEGHIKL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BDEGHJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BDEGIJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BDEHIJKL": {"m074":"Group D", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BDFGHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group I"},
  "BDFGHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group I", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BDFGHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BDFGHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BDFGIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group I", "m080":"Group K", "m081":"Group B", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "BDFHIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BDGHIJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BEFGHIJK": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "BEFGHIJL": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group I", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BEFGHIKL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "BEFGHJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BEFGIJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BEFHIJKL": {"m074":"Group F", "m077":"Group H", "m079":"Group E", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "BEGHIJKL": {"m074":"Group B", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "BFGHIJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group H", "m080":"Group K", "m081":"Group B", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "CDEFGHIJ": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group E"},
  "CDEFGHIK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "CDEFGHIL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group E", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDEFGHJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group E"},
  "CDEFGHJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group E", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDEFGHKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDEFGIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group J", "m085":"Group G", "m087":"Group I"},
  "CDEFGIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group E", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "CDEFGIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group I", "m085":"Group G", "m087":"Group L"},
  "CDEFGJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "CDEFHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group H", "m085":"Group J", "m087":"Group I"},
  "CDEFHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group E", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "CDEFHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group E", "m087":"Group L"},
  "CDEFHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "CDEFIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group E", "m082":"Group I", "m085":"Group J", "m087":"Group L"},
  "CDEGHIJK": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "CDEGHIJL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDEGHIKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDEGHJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDEGIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "CDEHIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "CDFGHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "CDFGHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group I", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDFGHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDFGHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CDFGIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group I", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "CDFHIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group C", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "CDGHIJKL": {"m074":"Group C", "m077":"Group D", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "CEFGHIJK": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "CEFGHIJL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CEFGHIKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CEFGHJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "CEFGIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "CEFHIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "CEGHIJKL": {"m074":"Group C", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "CFGHIJKL": {"m074":"Group C", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "DEFGHIJK": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group I"},
  "DEFGHIJL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group I", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "DEFGHIKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "DEFGHJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group J", "m082":"Group H", "m085":"Group G", "m087":"Group L"},
  "DEFGIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "DEFHIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "DEGHIJKL": {"m074":"Group D", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
  "DFGHIJKL": {"m074":"Group D", "m077":"Group F", "m079":"Group H", "m080":"Group K", "m081":"Group I", "m082":"Group J", "m085":"Group G", "m087":"Group L"},
  "EFGHIJKL": {"m074":"Group F", "m077":"Group G", "m079":"Group E", "m080":"Group K", "m081":"Group I", "m082":"Group H", "m085":"Group J", "m087":"Group L"},
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
      stats[home].won++; stats[home].points+=3; stats[away].lost++; h2h[home][away].points+=3
    } else if (result==='away') {
      stats[away].won++; stats[away].points+=3; stats[home].lost++; h2h[away][home].points+=3
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

// ── Qualifiers ────────────────────────────────────────────────────────────

export function calculateAllQualifiers(fixtures, predictions) {
  const standings = {}
  const thirdPlaceTeams = []

  for (const group of Object.keys(GROUPS)) {
    const fixtureIds = GROUP_FIXTURES[group]
    const allPredicted = fixtureIds.every(fid => {
      const p = predictions[fid]
      return p && p.score90Home!==undefined && p.score90Away!==undefined &&
             p.score90Home!=='' && p.score90Away!==''
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

// ── Annex C assignment ────────────────────────────────────────────────────

export function assignThirdPlaceTeams(best8Third) {
  if (best8Third.length < 8) return {}

  const key = best8Third.map(t => t.group.replace('Group ','')).sort().join('')
  const teamByGroup = {}
  best8Third.forEach(t => { teamByGroup[t.group] = t.team })

  const row = ANNEX_C[key]
  if (!row) return {}

  const assignments = {}
  for (const [fixture, groupName] of Object.entries(row)) {
    if (teamByGroup[groupName]) assignments[fixture] = teamByGroup[groupName]
  }
  return assignments
}

// ── Generate Round of 32 ──────────────────────────────────────────────────

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

// ── Knockout winner helper ────────────────────────────────────────────────

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
