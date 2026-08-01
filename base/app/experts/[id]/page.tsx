import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AppShell,
  BottomBar,
  ScreenBody,
  SectionGap,
  TopBar,
} from "@/components/app-shell";
import { Badge } from "@/components/badge";
import { MessageIcon, ShareIcon, StarIcon, VideoIcon } from "@/components/icons";
import { AvatarBox } from "@/components/photo";
import { Temperature, TemperatureMeter } from "@/components/temperature";
import { getExpert, getExpertIds, type ExpertService } from "@/lib/mock";

export function generateStaticParams() {
  return getExpertIds().map((id) => ({ id }));
}

export default async function ExpertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getExpert(id);
  if (!data) notFound();

  const { expert, bio, top_percent, services, reviews, review_count } = data;

  return (
    <AppShell>
      <TopBar
        backHref="/experts"
        title={
          <span className="cond text-[16px] font-semibold tracking-[0.1em]">
            EXPERT
          </span>
        }
        right={<ShareIcon size={20} />}
      />

      <ScreenBody>
        <section className="px-4 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <AvatarBox />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-bold">{expert.nickname}</span>
                <Badge variant="ink" cond>
                  {expert.grade}
                </Badge>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Temperature value={expert.temperature} size={13} />
                <TemperatureMeter value={expert.temperature} />
                <span className="cond text-[11px] text-neutral-600">
                  TOP {top_percent}%
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-600">
            {bio}
          </p>
        </section>

        <SectionGap />

        <section className="px-4 pt-3.5 pb-4">
          <h2 className="mb-2.5 text-[14px] font-bold">상담 상품</h2>
          <div className="flex flex-col gap-2">
            {services.map((s, i) => (
              <ServiceCard key={s.id} service={s} featured={i === 0} />
            ))}
          </div>
        </section>

        <SectionGap />

        <section className="px-4 pt-3.5">
          <h2 className="mb-1 text-[14px] font-bold">
            후기 <span className="cond text-accent-700">{review_count}</span>
          </h2>
          {reviews.map((r, i) => (
            <article
              key={r.id}
              className={`py-2.5 ${
                i < reviews.length - 1
                  ? "border-b border-dashed border-neutral-400"
                  : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex gap-px">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon
                      key={n}
                      filled={n <= r.rating}
                      className={
                        n <= r.rating ? "text-accent" : "text-neutral-400"
                      }
                    />
                  ))}
                </span>
                <span className="text-[12px] font-semibold text-neutral-600">
                  {r.author_nickname}
                </span>
                <span className="ml-auto text-[11px] text-neutral-600">
                  {r.created_at}
                </span>
              </div>
              <p className="mt-1 text-[13.5px] leading-relaxed">{r.body}</p>
            </article>
          ))}
        </section>
      </ScreenBody>

      <BottomBar>
        <Link
          href="/booking/bk-2"
          className="flex h-12 items-center justify-center bg-accent text-[15px] font-bold text-white"
        >
          예약하기
        </Link>
      </BottomBar>
    </AppShell>
  );
}

function ServiceCard({
  service,
  featured,
}: {
  service: ExpertService;
  featured: boolean;
}) {
  const Icon = service.format === "chat" ? MessageIcon : VideoIcon;

  return (
    <div
      className={`p-3.5 ${
        featured
          ? "border border-accent bg-accent-100"
          : "border border-neutral-400"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Icon
            size={16}
            className={featured ? "text-accent-700" : "text-neutral-600"}
          />
          <span className="text-[14.5px] font-bold">{service.title}</span>
        </span>
        <span
          className={`cond text-[17px] font-bold ${
            featured ? "text-accent-700" : ""
          }`}
        >
          ₩{service.price.toLocaleString("ko-KR")}
        </span>
      </div>
      <p className="mt-1.5 pl-6 text-[12px] text-neutral-600">
        {service.description}
      </p>
    </div>
  );
}
