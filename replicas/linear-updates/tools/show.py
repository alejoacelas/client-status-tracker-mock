import json,sys
for r in json.load(open(sys.argv[1])):
  print('##',r['t'])
  for c in r.get('chain',[])[:int(sys.argv[2]) if len(sys.argv)>2 else 6]: print('  ',{k:v for k,v in c.items() if v and v not in ('0px','normal','1','rgba(0, 0, 0, 0)')})
