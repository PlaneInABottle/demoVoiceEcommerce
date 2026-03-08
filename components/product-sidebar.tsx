import products from '@/data/products.json';

export function ProductSidebar() {
  return (
    <aside className="panel sidebar-panel">
      <header className="panel__header">
        <div>
          <h2>Featured products</h2>
          <p className="helper-copy">Static catalog data shared by the web app and agent worker.</p>
        </div>
      </header>

      <div className="product-card-list">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-card__topline">
              <strong>{product.name}</strong>
              <span>${product.price}</span>
            </div>
            <p>{product.summary}</p>
            <ul>
              {product.features.slice(0, 2).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </aside>
  );
}
