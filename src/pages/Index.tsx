import WeatherMap from "@/components/WeatherMap";

const Index = () => {
  return (
    <main>
      <header className="py-10">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Global Weather Forecast Map</h1>
          <p className="text-muted-foreground max-w-2xl">
            Ventusky-style interactive globe powered by Mapbox with forecast overlays for temperature, wind, and precipitation.
          </p>
        </div>
      </header>
      <section className="container pb-12">
        <WeatherMap />
      </section>
    </main>
  );
};

export default Index;
