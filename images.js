// Photos of the built-in dishes: free photos from Unsplash (unsplash.com/license), loaded from its CDN.
// Key = recipe id, value = the photo's id on images.unsplash.com. A recipe's own photo wins over these.
const PHOTO = {
  'bf-yogurt': '1530259152377-3a014e1092e0', 'bf-oats': '1610406765661-57646c40da59', 'bf-avo': '1613769049987-b31b641f25b1',
  'm-sushi': '1553621042-f6e147245754', 'm-bolognese': '1622973536968-3ead9e780960', 'm-baked-bolognese': '1654780105295-9227206f11ec',
  'm-fajitas': '1689773976415-293dd893f77e', 'm-ciabatta': '1481070414801-51fd732d7184', 'm-sandwiches': '1553909489-cd47e0907980',
  'm-egg-sandwich': '1525351484163-7529414344d8', 'm-frittata': '1510693206972-df098062cb71', 'm-quiche': '1650844010413-3f24dc1c182b',
  'm-fish-broccoli': '1633030175953-ac5a41b7353c', 'm-fish-sweet': '1665401015549-712c0dc5ef85', 'm-beef-stirfry': '1760504526069-ff0f8bf6e4ca',
  'm-salmon-avocado': '1633862472152-e3873eb1b3ff', 'm-salmon-broccoli': '1675209705883-7aec595f5aa8', 'm-spinach-pasta': '1673081849734-98f0969d436b',
  'm-potato-pasta': '1603105037880-880cd4edfb0d', 'm-legume-pasta': '1688923130941-889a41f4439c', 'm-chicken-thighs': '1523813301608-f54a198f6b5f',
  'm-shrimp': '1761545832792-535fafbad368', 'm-roast-chicken': '1615557960916-5f4791effe9d', 'm-ciambotta': '1652622550740-f90d03edfbf0',
  's-caesar': '1605291535065-e1d52d2b264a', 's-meatballs': '1565086869529-8c7802cca7a0', 's-shrimp-tacos': '1660180750968-4fbc84789a96',
  's-greek-bowl': '1682617666455-3a80f4e58840', 's-pesto-chicken': '1555949258-eb67b1ef0ceb', 's-caprese': '1595587870672-c79b47875c6a',
  's-tuna-wrap': '1563282397-db1ac3a6bf86', 's-minestrone': '1643786661490-966f1877effa', 's-chicken-curry': '1679279727895-bd5c9fb9c1a0',
  's-chili': '1716535232842-d10da4eb33d5', 's-stuffed-peppers': '1596464716059-f81da526557b', 's-parmigiana': '1632229095740-8c75082087c5',
  's-carbonara': '1633337474564-1d9478ca4e2e', 's-risotto': '1633964913295-ceb43826e7c9', 's-steak': '1712746785126-e9f28b5b3cc0',
  's-cod': '1559848062-8d9d54682e1a', 's-turkey-burger': '1555291818-aa342c4e1870', 's-chicken-soup': '1664337873053-840ea51d271d',
  's-lentil-soup': '1642497394078-4794e837019c', 's-pizza': '1604068549290-dea0e4a305ca', 's-quesadilla': '1618040996337-56904b7850b9',
  's-poke': '1670816978291-a5cf23d87968', 'sb-scrambled': '1563690449029-d6e1b8d6003d', 'sb-pancakes': '1528207776546-365bb710ee93',
  'sb-smoothie': '1654923064926-be7e64267a31', 'sb-bagel': '1707079266703-b67f36a881f1', 'sb-overnight': '1541809570-cce873416d94',
};

// Two sizes only, so each photo is downloaded (and kept for offline use) at most twice.
export const SIZES = { thumb: 'w=160&h=160', card: 'w=800&h=520' };
export function builtinPhoto(id, size = 'thumb') {
  return PHOTO[id] ? `https://images.unsplash.com/photo-${PHOTO[id]}?${SIZES[size]}&fit=crop&q=70&auto=format` : '';
}
