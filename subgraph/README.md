# The Graph Subgraph for CemeteryManagerV2

This subgraph indexes all events from the CemeteryManagerV2 contract, enabling efficient GraphQL queries without expensive RPC calls.

## Why Use The Graph?

### Problems It Solves

1. **Slow Frontend Queries**: Instead of iterating through 1000s of graves via RPC, query instantly via GraphQL
2. **Complex Filtering**: Find "all graves in cemetery X reserved in 2023" in milliseconds
3. **Real-Time Analytics**: Dashboard updates automatically as events are emitted
4. **Reduced Costs**: Pay once for indexing, query unlimited times for free

### Performance Comparison

**Without Subgraph (Direct RPC):**
```javascript
// Fetch all graveyards
const totalGraveyards = await contract.getTotalGraveyards();
for (let i = 1; i <= totalGraveyards; i++) {
  const graveyard = await contract.getGraveyard(i); // 100+ RPC calls!
}
// Time: 10-30 seconds
// Cost: High (Infura/Alchemy charges per request)
```

**With Subgraph (GraphQL):**
```graphql
query {
  graveyards(first: 100) {
    id
    name
    location
    graves(where: { reserved: true }) {
      owner
      price
    }
  }
}
# Time: <100ms
# Cost: Free (after indexing)
```

## Setup Instructions

### Prerequisites

1. Install Graph CLI:
```bash
npm install -g @graphprotocol/graph-cli
```

2. Create account on [The Graph Studio](https://thegraph.com/studio/)

### Step 1: Update Configuration

Edit `subgraph.yaml`:

```yaml
source:
  address: "YOUR_DEPLOYED_CONTRACT_ADDRESS"
  startBlock: YOUR_DEPLOYMENT_BLOCK_NUMBER
network: sepolia  # or mainnet, polygon, etc.
```

### Step 2: Generate Types

```bash
cd subgraph
graph codegen
```

This generates TypeScript types from your schema and ABIs.

### Step 3: Build

```bash
graph build
```

### Step 4: Deploy

**Option A: Deploy to The Graph Studio (Recommended)**

```bash
# Authenticate
graph auth --studio YOUR_DEPLOY_KEY

# Deploy
graph deploy --studio cemetery-manager-v2
```

**Option B: Deploy to Hosted Service (Deprecated)**

```bash
graph deploy --product hosted-service YOUR_GITHUB_USERNAME/cemetery-manager-v2
```

**Option C: Self-Host (Advanced)**

Deploy your own Graph Node using Docker:
```bash
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker
# Edit docker-compose.yml with your settings
docker-compose up
```

## Querying the Subgraph

### Example Queries

#### 1. Get All Graveyards

```graphql
query GetGraveyards {
  graveyards(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    name
    location
    owner
    latitude
    longitude
    reservedCount
    totalRevenue
  }
}
```

#### 2. Find Available Graves in a Cemetery

```graphql
query AvailableGraves($graveyardId: String!) {
  graves(
    where: {
      graveyard: $graveyardId
      reserved: false
    }
    orderBy: price
  ) {
    id
    price
    latitude
    longitude
    locationHash
  }
}
```

#### 3. Get User's Graves

```graphql
query UserGraves($userAddress: String!) {
  user(id: $userAddress) {
    graves {
      id
      graveyard {
        name
        location
      }
      price
      reservedAt
      metadataHash
    }
    totalSpent
  }
}
```

#### 4. Analytics Dashboard Data

```graphql
query Analytics {
  globalStats(id: "1") {
    totalGraveyards
    totalGraves
    totalReserved
    totalRevenue
    averagePrice
  }

  dailyStats(
    first: 30
    orderBy: date
    orderDirection: desc
  ) {
    id
    date
    reservations
    revenue
  }
}
```

#### 5. Search by Price Range

```graphql
query GravesByPriceRange($minPrice: BigInt!, $maxPrice: BigInt!) {
  graves(
    where: {
      price_gte: $minPrice
      price_lte: $maxPrice
      reserved: false
    }
    first: 100
  ) {
    id
    graveyard {
      name
      location
    }
    price
    latitude
    longitude
  }
}
```

#### 6. Recent Reservations

```graphql
query RecentReservations {
  reservations(
    first: 10
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    reservedBy
    amount
    timestamp
    grave {
      graveyard {
        name
      }
    }
  }
}
```

## Frontend Integration

### Install Apollo Client

```bash
npm install @apollo/client graphql
```

### Setup in React

```javascript
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.studio.thegraph.com/query/<SUBGRAPH_ID>/cemetery-manager-v2/<VERSION>',
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <YourApp />
    </ApolloProvider>
  );
}
```

### Use in Components

```javascript
import { useQuery, gql } from '@apollo/client';

const GET_GRAVEYARDS = gql`
  query {
    graveyards {
      id
      name
      location
    }
  }
`;

function GraveyardsList() {
  const { loading, error, data } = useQuery(GET_GRAVEYARDS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.graveyards.map(g => (
        <div key={g.id}>
          <h3>{g.name}</h3>
          <p>{g.location}</p>
        </div>
      ))}
    </div>
  );
}
```

## Schema Entities

### Graveyard
- All cemetery information
- GPS coordinates
- Aggregated stats (reservedCount, totalRevenue)

### Grave
- Individual grave details
- Links to graveyard
- GPS location
- IPFS hashes for metadata

### Reservation
- Reservation history
- Links to grave and user

### GlobalStats
- Overall system statistics
- Updated in real-time

### DailyStats / MonthlyStats
- Time-series analytics data
- For charts and dashboards

### User
- User activity tracking
- All graves owned
- Total spent

## Performance Tips

### 1. Use Pagination

```graphql
query GravesWithPagination($skip: Int!, $first: Int!) {
  graves(skip: $skip, first: $first) {
    id
    price
  }
}
```

### 2. Only Query What You Need

```graphql
# ❌ BAD: Fetches unnecessary data
query {
  graves {
    id
    graveyard {
      id
      name
      owner
      graves {
        id
        price
      }
    }
  }
}

# ✅ GOOD: Minimal data
query {
  graves {
    id
    graveyard {
      name
    }
  }
}
```

### 3. Use Fragments

```graphql
fragment GraveDetails on Grave {
  id
  price
  reserved
  latitude
  longitude
}

query {
  graves {
    ...GraveDetails
  }
}
```

### 4. Cache Queries

Apollo Client automatically caches results. Configure TTL:

```javascript
const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          graveyards: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
```

## Monitoring

### Check Indexing Status

```graphql
query {
  _meta {
    block {
      number
      hash
    }
    deployment
    hasIndexingErrors
  }
}
```

### View Logs

In The Graph Studio:
1. Go to your subgraph
2. Click "Logs" tab
3. Check for indexing errors

## Troubleshooting

### Issue: Subgraph Not Syncing

**Solutions:**
1. Check if contract address is correct in `subgraph.yaml`
2. Verify `startBlock` is correct (not before deployment)
3. Check network name matches (sepolia vs goerli)
4. Review logs for errors

### Issue: Schema Mismatch Errors

**Solution:**
```bash
# Regenerate types
rm -rf generated/
graph codegen
graph build
```

### Issue: Query Returns No Data

**Solutions:**
1. Check if contracts have any activity
2. Verify subgraph is fully synced (`_meta.block.number`)
3. Test with simpler query first
4. Check entity IDs match expectations

## Costs

### The Graph Studio Pricing

- **Free Tier**: 100k queries/month
- **Pay-as-you-go**: $4 per 100k queries after free tier
- **Indexing**: ~$0.01 per 1000 blocks (one-time)

For a cemetery management system:
- Initial indexing: ~$1-5 (depends on chain)
- Monthly queries: Usually within free tier

### Self-Hosting Costs

- Server: ~$20-50/month (AWS/DigitalOcean)
- Storage: ~$10/month
- Total: ~$30-60/month

**Recommendation**: Use The Graph Studio for production. Self-host only if:
- Extremely high query volume (>10M/month)
- Need custom infrastructure
- Privacy requirements

## Next Steps

1. Deploy subgraph to The Graph Studio
2. Update frontend to use GraphQL
3. Build analytics dashboard using DailyStats
4. Implement real-time updates with subscriptions
5. Add full-text search (requires custom resolver)

## Resources

- [The Graph Docs](https://thegraph.com/docs/)
- [AssemblyScript Docs](https://www.assemblyscript.org/)
- [GraphQL Tutorial](https://graphql.org/learn/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)

---

**Questions?** Check the mapping code in `src/mapping.ts` to understand how events are processed.
