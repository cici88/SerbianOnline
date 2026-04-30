import { BookOpen, Users, GraduationCap } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Stories',
    description: 'Original illustrated stories for learners',
    color: 'bg-mint',
    borderColor: 'border-mint',
  },
  {
    icon: GraduationCap,
    title: 'Lessons',
    description: 'Book 1:1 sessions with a native teacher',
    color: 'bg-blush',
    borderColor: 'border-blush',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Join learners from around the world',
    color: 'bg-lavender',
    borderColor: 'border-lavender',
  },
];

export function FeatureCards() {
  return (
    <section className="px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(200,200,220,0.2)] border-2 ${feature.borderColor}/40 hover:shadow-[0_8px_30px_rgba(200,200,220,0.3)] transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Icon container */}
              <div
                className={`inline-flex items-center justify-center w-14 h-14 ${feature.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-7 h-7 text-foreground" />
              </div>

              {/* Title */}
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Decorative corner */}
              <div
                className={`absolute top-0 right-0 w-16 h-16 ${feature.color}/20 rounded-bl-[3rem] rounded-tr-2xl -z-10`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
