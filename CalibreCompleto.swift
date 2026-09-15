import Foundation
import SwiftUI
import Combine
import UIKit
@preconcurrency import AVFoundation
@preconcurrency import Vision
import CoreImage

// MARK: - TrainingModels

struct Movement: Identifiable {
    let id: String
    let name: String
    let group: String
    let icon: String
    static let all: [Movement] = [
        .init(id: "squat", name: "Agachamento", group: "Pernas", icon: "figure.strengthtraining.functional"),
        .init(id: "legpress", name: "Leg press", group: "Pernas", icon: "dumbbell.fill"),
        .init(id: "extension", name: "Cadeira extensora", group: "Pernas", icon: "dumbbell.fill"),
        .init(id: "curl", name: "Mesa flexora", group: "Pernas", icon: "dumbbell.fill"),
        .init(id: "row", name: "Remada", group: "Costas", icon: "figure.rower"),
        .init(id: "pulldown", name: "Puxada", group: "Costas", icon: "dumbbell.fill"),
        .init(id: "press", name: "Supino", group: "Peito", icon: "dumbbell.fill"),
        .init(id: "pushup", name: "Flexão", group: "Peito", icon: "figure.strengthtraining.functional"),
        .init(id: "biceps", name: "Rosca bíceps", group: "Braços", icon: "dumbbell.fill"),
        .init(id: "triceps", name: "Tríceps na polia", group: "Braços", icon: "dumbbell.fill"),
        .init(id: "shoulderpress", name: "Desenvolvimento", group: "Ombros", icon: "dumbbell.fill"),
        .init(id: "calf", name: "Elevação de panturrilha", group: "Pernas", icon: "dumbbell.fill"),
        .init(id: "crunch", name: "Abdominal", group: "Abdômen", icon: "figure.core.training"),
        .init(id: "hipthrust", name: "Elevação pélvica", group: "Glúteos", icon: "dumbbell.fill")
    ]
}

struct WorkoutRecord: Codable, Identifiable {
    var id = UUID()
    let date: Date
    let stage: Int
    let sets: [String: Int]
    // Opcionais permitem ler os registros originais sem inventar recompensas antigas.
    var plannedSets: [String: Int]? = nil
    var awardedXP: Int? = nil
    var exerciseXP: Int? = nil
    var weeklyBonus: Int? = nil
    var rewardWeek: String? = nil
    var totalSets: Int { sets.values.reduce(0, +) }
    var earnedXP: Int { awardedXP ?? 50 }
}

struct SavedTraining: Codable {
    var version = 2
    var records: [WorkoutRecord]
    var weekGoals: [String: Int]
}

enum TrainingDates {
    static var calendar: Calendar {
        var c = Calendar(identifier: .iso8601)
        c.timeZone = .current
        return c
    }
    static func week(_ date: Date) -> String {
        let c = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return "\(c.yearForWeekOfYear ?? 0)-W\(c.weekOfYear ?? 0)"
    }
}

@MainActor
final class TrainingStore: ObservableObject {
    @Published private(set) var records: [WorkoutRecord] = []
    @Published private(set) var weekGoals: [String: Int] = [:]
    @Published private(set) var errorMessage: String?
    private var unreadableData = false
    private let key = "calibre.training.v2"
    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        do {
            if let data = defaults.data(forKey: key) {
                let saved = try JSONDecoder().decode(SavedTraining.self, from: data)
                guard saved.version == 2 else { throw CocoaError(.fileReadCorruptFile) }
                records = saved.records
                weekGoals = saved.weekGoals
            } else if let data = defaults.data(forKey: "calibre.workouts.v1") {
                records = try JSONDecoder().decode([WorkoutRecord].self, from: data)
            }
        } catch {
            unreadableData = true
            errorMessage = "Não foi possível ler o histórico. Os dados foram preservados; não reinstale o app para tentar corrigir."
        }
    }
    var xp: Int { records.reduce(0) { $0 + $1.earnedXP } }
    var level: Int { xp / 250 + 1 }
    var nextStage: Int { records.count }
    var canSave: Bool { !unreadableData }

    func today(_ date: Date) -> [WorkoutRecord] {
        records.filter { TrainingDates.calendar.isDate($0.date, inSameDayAs: date) }
    }
    func sessionsThisWeek(_ date: Date) -> [WorkoutRecord] {
        records.filter { TrainingDates.week($0.date) == TrainingDates.week(date) }
    }
    func daysThisWeek(_ date: Date) -> Int {
        Set(sessionsThisWeek(date).map { TrainingDates.calendar.startOfDay(for: $0.date) }).count
    }
    func goal(at date: Date) -> Int { weekGoals[TrainingDates.week(date)] ?? 3 }
    func bonusEarned(at date: Date) -> Bool {
        records.contains { $0.rewardWeek == TrainingDates.week(date) && ($0.weeklyBonus ?? 0) > 0 }
    }
    func setGoal(_ value: Int, at date: Date) {
        guard canSave, sessionsThisWeek(date).isEmpty else { return }
        var goals = weekGoals
        goals[TrainingDates.week(date)] = min(7, max(1, value))
        persist(records, goals: goals)
    }
    func streak(at date: Date) -> Int {
        let c = TrainingDates.calendar
        let days = Set(records.map { c.startOfDay(for: $0.date) })
        var cursor = c.startOfDay(for: date)
        if !days.contains(cursor) {
            guard let yesterday = c.date(byAdding: .day, value: -1, to: cursor), days.contains(yesterday) else { return 0 }
            cursor = yesterday
        }
        var count = 0
        while days.contains(cursor) {
            count += 1
            guard let previous = c.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = previous
        }
        return count
    }

    // O lançamento de XP e o histórico são gravados juntos. Reenviar a mesma etapa não duplica XP.
    @discardableResult
    func finish(stage: Int, sets: [String: Int], planned: [String: Int], now: Date = Date()) -> Bool {
        guard canSave, stage == nextStage else { return false }
        let valid = sets.filter { entry in
            Movement.all.contains { $0.id == entry.key } && entry.value > 0 && entry.value <= 30
        }
        guard !valid.isEmpty else { return false }
        let targets = planned.filter { key, value in
            Movement.all.contains { $0.id == key } && (1...30).contains(value)
        }
        // Um exercício completo pode dar +10 uma vez ao dia, mesmo em sessões diferentes.
        let alreadyRewarded = Set(today(now).flatMap { record -> [String] in
            guard record.awardedXP != nil, let plan = record.plannedSets else { return [] }
            return record.sets.keys.filter { id in
                guard let target = plan[id] else { return false }
                return target > 0 && record.sets[id, default: 0] >= target
            }
        })
        let completed = valid.keys.filter { id in
            guard let target = targets[id] else { return false }
            return valid[id, default: 0] >= target && !alreadyRewarded.contains(id)
        }
        let exerciseXP = completed.count * 10
        let week = TrainingDates.week(now)
        var goals = weekGoals
        let target = goal(at: now)
        goals[week] = target
        var trainedDays = Set(sessionsThisWeek(now).map { TrainingDates.calendar.startOfDay(for: $0.date) })
        trainedDays.insert(TrainingDates.calendar.startOfDay(for: now))
        let bonus = trainedDays.count >= target && !bonusEarned(at: now) ? 100 : 0
        let record = WorkoutRecord(date: now, stage: stage, sets: valid, plannedSets: targets,
                                   awardedXP: 50 + exerciseXP + bonus, exerciseXP: exerciseXP,
                                   weeklyBonus: bonus, rewardWeek: week)
        return persist(records + [record], goals: goals)
    }
    @discardableResult
    private func persist(_ newRecords: [WorkoutRecord], goals: [String: Int]) -> Bool {
        do {
            let data = try JSONEncoder().encode(SavedTraining(records: newRecords, weekGoals: goals))
            defaults.set(data, forKey: key)
            records = newRecords
            weekGoals = goals
            errorMessage = nil
            return true
        } catch {
            errorMessage = "Não foi possível salvar. Tente novamente; o registro não foi concluído."
            return false
        }
    }
}


// MARK: - CalibreApp
// Calibre — iOS 17+. Veja LEIA-ME.md antes de integrar.
@main
@MainActor
struct CalibreApp: App {
    @StateObject private var store = TrainingStore()
    var body: some Scene {
        WindowGroup { ContentView().environmentObject(store) }
    }
}
enum Palette {
    static let green = Color(red: 0.30, green: 0.72, blue: 0.06)
    static let darkGreen = Color(red: 0.20, green: 0.52, blue: 0.02)
    static let ink = Color(red: 0.18, green: 0.23, blue: 0.29)
    static let muted = Color(red: 0.46, green: 0.51, blue: 0.56)
    static let line = Color(red: 0.88, green: 0.90, blue: 0.92)
    static let background = Color(red: 0.97, green: 0.98, blue: 0.96)
}
@MainActor
struct ContentView: View {
    @State private var selected = 0
    var body: some View {
        VStack(spacing: 0) {
            StatusHeader()
            Group {
                switch selected {
                case 1: ExerciciosView()
                case 2: JornadaView()
                case 3: MissaoView()
                default: HomeView()
                }
            }.frame(maxWidth: .infinity, maxHeight: .infinity)
            CustomTabBar(selected: $selected)
        }
        .background(Palette.background.ignoresSafeArea())
        .foregroundStyle(Palette.ink)
        .font(.system(.body, design: .rounded))
        .preferredColorScheme(.light)
    }
}
@MainActor
struct StatusHeader: View {
    @EnvironmentObject private var store: TrainingStore
    var body: some View {
        TimelineView(.periodic(from: .now, by: 60)) { context in
            HStack {
                Label("CALIBRE", systemImage: "dumbbell.fill")
                    .font(.system(.headline, design: .rounded, weight: .black)).foregroundStyle(Palette.green)
                Spacer(minLength: 8)
                Label("\(store.streak(at: context.date))", systemImage: "flame.fill").foregroundStyle(.orange)
                Label("\(store.xp)", systemImage: "bolt.fill").foregroundStyle(.blue)
            }.fontWeight(.bold).padding().background(.white)
        }
        Rectangle().fill(Palette.line).frame(height: 2)
    }
}
struct StageSelection: Identifiable { let id: Int }
@MainActor
struct HomeView: View {
    @EnvironmentObject private var store: TrainingStore
    @State private var selection: StageSelection?
    private let offsets: [CGFloat] = [0, -50, -75, -30, 45]
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 24) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("SUA TRILHA DE TREINOS").font(.caption.bold())
                        Text("Uma sessão de cada vez").font(.title2.bold())
                        Text("Registre seu treino e avance no seu ritmo.").font(.subheadline)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading).padding(20)
                    .foregroundStyle(.white).background(Palette.green, in: RoundedRectangle(cornerRadius: 20))
                    if let message = store.errorMessage {
                        Text(message).font(.callout).foregroundStyle(.red).card()
                    }
                    ForEach(0...store.nextStage / 5, id: \.self) { unit in
                        VStack(spacing: 12) {
                            Text("UNIDADE \(unit + 1) • \(unit == 0 ? "FUNDAÇÃO CORPORAL" : "CONSTRUINDO CONSTÂNCIA")")
                                .font(.caption.bold()).foregroundStyle(Palette.muted)
                            ForEach(0..<5, id: \.self) { position in
                                stageNode(unit * 5 + position, offset: offsets[position])
                            }
                        }
                    }
                    Text("Descanso também faz parte do treino. A trilha continua aqui quando você voltar.")
                        .font(.footnote).foregroundStyle(Palette.muted).multilineTextAlignment(.center).padding()
                }.padding()
            }
            .onAppear { proxy.scrollTo(store.nextStage, anchor: .center) }
            .onChange(of: store.nextStage) { _, newValue in
                withAnimation {
                    proxy.scrollTo(newValue, anchor: .center)
                }
            }
        }
        .sheet(item: $selection) { item in
            WorkoutView(stage: item.id).environmentObject(store)
        }
    }
    private func stageNode(_ index: Int, offset: CGFloat) -> some View {
        let done = index < store.nextStage
        let active = index == store.nextStage
        return VStack(spacing: 8) {
            if active {
                Text("COMEÇAR").font(.caption.bold()).foregroundStyle(Palette.green)
                    .padding(8).background(.white, in: Capsule())
                    .overlay(Capsule().stroke(Palette.line, lineWidth: 2))
            }
            Button { selection = StageSelection(id: index) } label: {
                ZStack {
                    Circle().fill(active ? Palette.darkGreen : (done ? Color.orange : Palette.line)).offset(y: 7)
                    Circle().fill(active ? Palette.green : (done ? Color.yellow : Color(red: 0.92, green: 0.93, blue: 0.94)))
                    Image(systemName: done ? "checkmark" : (active ? "dumbbell.fill" : "lock.fill"))
                        .font(.system(size: 29, weight: .black)).foregroundStyle(done || active ? .white : Palette.muted)
                }.frame(width: 78, height: 78).padding(8)
            }
            .buttonStyle(PressStyle()).disabled(!active || !store.canSave)
            .accessibilityLabel("Treino \(index + 1), \(done ? "concluído" : (active ? "disponível" : "bloqueado"))")
            Text("Treino \(index + 1)").font(.caption.bold()).foregroundStyle(Palette.muted)
            if index % 5 < 4 {
                Capsule().fill(done ? Palette.green.opacity(0.35) : Palette.line).frame(width: 5, height: 22)
            }
        }.offset(x: offset).frame(maxWidth: .infinity).id(index)
    }
}
@MainActor
struct ExerciciosView: View {
    @State private var search = ""
    var filtered: [Movement] {
        let query = search.trimmingCharacters(in: .whitespacesAndNewlines)
        return Movement.all.filter { query.isEmpty || ($0.name + " " + $0.group).localizedStandardContains(query) }
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Exercícios").font(.largeTitle.bold())
                Text("Explore os movimentos do seu registro.").foregroundStyle(Palette.muted)
                HStack {
                    Image(systemName: "magnifyingglass")
                    TextField("Buscar exercício ou grupo", text: $search).autocorrectionDisabled()
                    if !search.isEmpty { Button { search = "" } label: { Image(systemName: "xmark.circle.fill") }.accessibilityLabel("Limpar busca") }
                }.card()
                if filtered.isEmpty { Text("Nenhum exercício encontrado.").foregroundStyle(Palette.muted) }
                ForEach(filtered) { movement in
                    HStack(spacing: 14) {
                        Image(systemName: movement.icon).font(.title2).foregroundStyle(Palette.green)
                            .frame(width: 54, height: 54).background(Palette.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 14))
                        VStack(alignment: .leading, spacing: 5) {
                            Text(movement.name).font(.headline)
                            Text(movement.group).font(.caption).foregroundStyle(Palette.muted)
                        }
                        Spacer()
                    }.card()
                }
            }.padding()
        }.scrollDismissesKeyboard(.interactively)
    }
}
@MainActor
struct JornadaView: View {
    @State private var selectedRecord: WorkoutRecord?
    @EnvironmentObject private var store: TrainingStore
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Sua jornada").font(.largeTitle.bold())
                HStack {
                    StatItem(value: "\(store.records.count)", label: "Treinos", icon: "dumbbell.fill", color: Palette.green)
                    StatItem(value: "\(store.xp)", label: "XP total", icon: "bolt.fill", color: .blue)
                }
                VStack(alignment: .leading, spacing: 12) {
                    Label("Nível \(store.level)", systemImage: "star.fill").font(.title2.bold()).foregroundStyle(.orange)
                    ProgressView(value: Double(store.xp % 250), total: 250).tint(Palette.green)
                    Text("\(250 - store.xp % 250) XP para o próximo nível").font(.subheadline)
                }.card()
                Text("Conquistas").font(.title2.bold())
                achievement("Primeiro passo", subtitle: "Conclua 1 treino", earned: store.records.count >= 1)
                achievement("Pegando o ritmo", subtitle: "Conclua 5 treinos", earned: store.records.count >= 5)
                achievement("Constância", subtitle: "Conclua 10 treinos", earned: store.records.count >= 10)
                Text("Histórico recente").font(.title2.bold())
                Text("Toque em um treino para ver o mapa daquele dia.").font(.caption).foregroundStyle(Palette.muted)
                if store.records.isEmpty { Text("Seu primeiro treino começa na trilha.").foregroundStyle(Palette.muted) }
                ForEach(Array(store.records.suffix(10).reversed())) { record in
                    HStack {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Treino \(record.stage + 1)").font(.headline)
                            Text(record.date, style: .date).font(.caption).foregroundStyle(Palette.muted)
                        }
                        Spacer()
                        Text("\(record.totalSets) séries • +\(record.earnedXP) XP").font(.caption.bold())
                    }.card()
                    .onTapGesture { selectedRecord = record }
                    .accessibilityAddTraits(.isButton)
                }
            }.padding()
        }
        .sheet(item: $selectedRecord) { record in
            NavigationStack { WorkoutSummaryView(record: record).environmentObject(store) }
        }
    }
    private func achievement(_ title: String, subtitle: String, earned: Bool) -> some View {
        HStack(spacing: 14) {
            Image(systemName: earned ? "medal.fill" : "lock.fill").font(.title).foregroundStyle(earned ? .orange : Palette.muted)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.headline)
                Text(subtitle).font(.caption).foregroundStyle(Palette.muted)
            }
            Spacer()
            if earned { Image(systemName: "checkmark.circle.fill").foregroundStyle(Palette.green) }
        }.card().accessibilityElement(children: .combine)
    }
}
@MainActor
struct StatItem: View {
    let value: String
    let label: String
    let icon: String
    let color: Color
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon).foregroundStyle(color)
            Text(value).font(.title.bold())
            Text(label).font(.caption).foregroundStyle(Palette.muted)
        }.frame(maxWidth: .infinity).card()
    }
}
@MainActor
struct CustomTabBar: View {
    @Binding var selected: Int
    private let titles = ["Trilha", "Exercícios", "Jornada", "Missão"]
    private let icons = ["map.fill", "dumbbell.fill", "chart.bar.fill", "flag.fill"]
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<4, id: \.self) { index in
                Button { selected = index } label: {
                    VStack(spacing: 6) {
                        Image(systemName: icons[index]).font(.title3)
                        Text(titles[index]).font(.system(size: 10, weight: .bold, design: .rounded))
                    }
                    .frame(maxWidth: .infinity).padding(.vertical, 10)
                    .foregroundStyle(selected == index ? Palette.green : Palette.muted)
                    .background(selected == index ? Palette.green.opacity(0.12) : .clear, in: RoundedRectangle(cornerRadius: 14))
                }.buttonStyle(.plain).accessibilityAddTraits(selected == index ? .isSelected : [])
            }
        }.padding(.horizontal, 12).padding(.vertical, 8).background(.white)
            .overlay(alignment: .top) { Rectangle().fill(Palette.line).frame(height: 2) }
    }
}
@MainActor
struct PressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.scaleEffect(configuration.isPressed ? 0.94 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}
@MainActor
struct GreenButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var enabled
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(.system(.headline, design: .rounded, weight: .bold))
            .frame(maxWidth: .infinity).padding(.vertical, 18).padding(.horizontal, 12)
            .foregroundStyle(.white)
            .background(enabled ? Palette.green : Palette.muted, in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: enabled ? Palette.darkGreen : Palette.line, radius: 0, y: configuration.isPressed ? 0 : 5)
            .offset(y: configuration.isPressed ? 4 : 0)
    }
}
extension View {
    func card() -> some View {
        padding(16).background(.white, in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Palette.line, lineWidth: 2))
    }
}

// MARK: - WorkoutFeatures

@MainActor
struct WorkoutView: View {
    let stage: Int
    @EnvironmentObject private var store: TrainingStore
    @Environment(\.dismiss) private var dismiss
    @State private var planned: [String: Int] = [:]
    @State private var sets: [String: Int] = [:]
    @State private var saved: WorkoutRecord?
    @State private var confirmExit = false
    @State private var camera = false
    var total: Int { sets.values.reduce(0, +) }

    var body: some View {
        NavigationStack {
            Group {
                if let saved {
                    WorkoutSummaryView(record: saved)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            Text("Seu treino, seu ritmo").font(.title.bold())
                            Text("Selecione os exercícios e as séries do seu plano. Marque somente o que realizou.")
                                .foregroundStyle(Palette.muted)
                            Label("\(total) séries registradas", systemImage: "checkmark.circle.fill")
                                .foregroundStyle(Palette.green)
                            ForEach(Movement.all) { movement in
                                exerciseRow(movement)
                            }
                            Text("+50 XP por sessão. +10 XP por exercício com todas as séries planejadas concluídas, uma vez ao dia. Séries extras não aumentam o XP.")
                                .font(.footnote).foregroundStyle(Palette.muted)
                            if let message = store.errorMessage { Text(message).foregroundStyle(.red) }
                        }.padding()
                    }
                    .safeAreaInset(edge: .bottom) {
                        Button("CONCLUIR E VER RESUMO") {
                            if store.finish(stage: stage, sets: sets, planned: planned) {
                                saved = store.records.last
                            }
                        }.buttonStyle(GreenButtonStyle())
                            .disabled(total == 0 || !store.canSave).padding().background(.white)
                    }
                }
            }
            .background(Palette.background)
            .navigationTitle(saved == nil ? "Treino \(stage + 1)" : "Treino concluído")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(saved == nil ? "Sair" : "Fechar") {
                        if total > 0 && saved == nil { confirmExit = true } else { dismiss() }
                    }
                }
            }
            .confirmationDialog("Descartar este registro?", isPresented: $confirmExit, titleVisibility: .visible) {
                Button("Descartar e sair", role: .destructive) { dismiss() }
                Button("Continuar", role: .cancel) { }
            } message: { Text("As séries desta sessão ainda não foram salvas.") }
            .sheet(isPresented: $camera) {
                CameraWorkoutView { _ in
                    let target = planned["squat", default: 0]
                    sets["squat"] = min(target, sets["squat", default: 0] + 1)
                }
            }
        }.interactiveDismissDisabled(total > 0 && saved == nil)
    }

    private func exerciseRow(_ movement: Movement) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle(isOn: Binding(
                get: { planned[movement.id, default: 0] > 0 },
                set: { selected in
                    planned[movement.id] = selected ? 3 : 0
                    if !selected { sets[movement.id] = 0 }
                }
            )) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(movement.name).font(.headline)
                    Text(movement.group).font(.caption).foregroundStyle(Palette.muted)
                }
            }.tint(Palette.green)
            if planned[movement.id, default: 0] > 0 {
                Stepper("Planejadas: \(planned[movement.id, default: 3]) séries", value: Binding(
                    get: { planned[movement.id, default: 3] },
                    set: { target in
                        planned[movement.id] = target
                        sets[movement.id] = min(target, sets[movement.id, default: 0])
                    }
                ), in: 1...30)
                Stepper("Feitas: \(sets[movement.id, default: 0]) séries", value: Binding(
                    get: { sets[movement.id, default: 0] },
                    set: { sets[movement.id] = $0 }
                ), in: 0...planned[movement.id, default: 3])
                if sets[movement.id, default: 0] >= planned[movement.id, default: 3] {
                    Label("Exercício concluído", systemImage: "checkmark.circle.fill").foregroundStyle(Palette.green)
                }
                if movement.id == "squat" {
                    Button { camera = true } label: {
                        Label("Câmera • agachamento experimental", systemImage: "camera.fill")
                    }.disabled(sets["squat", default: 0] >= planned["squat", default: 3])
                }
            }
        }.card()
    }
}

@MainActor
struct MissaoView: View {
    @EnvironmentObject private var store: TrainingStore
    var body: some View {
        TimelineView(.periodic(from: .now, by: 60)) { context in
            let date = context.date
            let sessions = store.today(date)
            let goal = store.goal(at: date)
            let days = store.daysThisWeek(date)
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Seus desafios").font(.largeTitle.bold())
                    Text("Conquiste XP seguindo seu plano, incluindo os dias de descanso.").foregroundStyle(Palette.muted)
                    challenge("Treino do dia", detail: "Conclua uma sessão • +50 XP por sessão", done: !sessions.isEmpty)
                    challenge("Exercício completo", detail: "Todas as séries planejadas • +10 XP por exercício, uma vez ao dia", done: sessions.contains { ($0.exerciseXP ?? 0) > 0 })
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Constância semanal • +100 XP", systemImage: "calendar").font(.headline)
                        Stepper("Meta: \(goal) dias de treino", value: Binding(
                            get: { store.goal(at: date) },
                            set: { store.setGoal($0, at: date) }
                        ), in: 1...7).disabled(!store.sessionsThisWeek(date).isEmpty || !store.canSave)
                        ProgressView(value: Double(min(days, goal)), total: Double(goal)).tint(Palette.green)
                        Text("\(days) de \(goal) dias • segunda a domingo").font(.subheadline)
                        if store.bonusEarned(at: date) {
                            Label("Bônus recebido nesta semana", systemImage: "checkmark.seal.fill").foregroundStyle(Palette.green)
                        }
                        Text("A meta fica fixa após o primeiro treino da semana. Várias sessões no mesmo dia contam como um dia. Descanso não retira XP nem bloqueia a trilha.")
                            .font(.caption).foregroundStyle(Palette.muted)
                    }.card()
                    HStack {
                        StatItem(value: "\(sessions.count)", label: "Treinos hoje", icon: "dumbbell.fill", color: Palette.green)
                        StatItem(value: "\(sessions.reduce(0) { $0 + $1.earnedXP })", label: "XP hoje", icon: "bolt.fill", color: .blue)
                    }
                    if let message = store.errorMessage { Text(message).foregroundStyle(.red) }
                }.padding()
            }
        }
    }
    private func challenge(_ title: String, detail: String, done: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: done ? "checkmark.circle.fill" : "flag.fill").foregroundStyle(Palette.green)
            VStack(alignment: .leading, spacing: 5) {
                Text(title).font(.headline)
                Text(detail).font(.caption).foregroundStyle(Palette.muted)
            }
            Spacer()
        }.card()
    }
}

@MainActor
struct WorkoutSummaryView: View {
    let record: WorkoutRecord
    @EnvironmentObject private var store: TrainingStore
    @State private var sharedImage: UIImage?
    @State private var share = false
    @State private var exportError = false
    private var daily: [WorkoutRecord] { store.today(record.date) }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Label("+\(record.earnedXP) XP neste treino", systemImage: "bolt.fill").font(.title2.bold()).foregroundStyle(Palette.green)
                Text("Sessão: +50 • Exercícios: +\(record.exerciseXP ?? 0) • Semana: +\(record.weeklyBonus ?? 0)")
                    .font(.caption).foregroundStyle(Palette.muted)
                DailyMapCard(records: daily, date: record.date)
                Button {
                    let renderer = ImageRenderer(content: DailyMapCard(records: daily, date: record.date)
                        .padding(20).frame(width: 420).background(.white).environment(\.colorScheme, .light))
                    renderer.scale = 2
                    if let image = renderer.uiImage { sharedImage = image; share = true }
                    else { exportError = true }
                } label: { Label("COMPARTILHAR IMAGEM", systemImage: "square.and.arrow.up") }
                    .buttonStyle(GreenButtonStyle())
            }.padding()
        }
        .background(Palette.background)
        .sheet(isPresented: $share) {
            if let sharedImage { ImageShareSheet(image: sharedImage) }
        }
        .alert("Não foi possível gerar a imagem", isPresented: $exportError) {
            Button("OK", role: .cancel) { }
        } message: { Text("Tente compartilhar novamente.") }
    }
}

@MainActor
struct ImageShareSheet: UIViewControllerRepresentable {
    let image: UIImage
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [image], applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) { }
}


// MARK: - MuscleMap

enum Muscle: String, CaseIterable, Identifiable {
    case chest = "Peito", back = "Costas", shoulders = "Ombros"
    case biceps = "Bíceps", triceps = "Tríceps", core = "Abdômen"
    case glutes = "Glúteos", quads = "Quadríceps", hamstrings = "Posteriores de coxa", calves = "Panturrilhas"
    var id: String { rawValue }
    var lower: Bool { [Muscle.glutes, .quads, .hamstrings, .calves].contains(self) }
}

extension Movement {
    // Mapeamento ilustrativo para versões comuns dos movimentos.
    // Não mede ativação, intensidade, fadiga ou recrutamento individual.
    var primary: Set<Muscle> {
        switch id {
        case "squat", "legpress": return [.quads, .glutes]
        case "extension": return [.quads]
        case "curl": return [.hamstrings]
        case "row", "pulldown": return [.back]
        case "press", "pushup": return [.chest]
        case "biceps": return [.biceps]
        case "triceps": return [.triceps]
        case "shoulderpress": return [.shoulders]
        case "calf": return [.calves]
        case "crunch": return [.core]
        case "hipthrust": return [.glutes]
        default: return []
        }
    }
    var secondary: Set<Muscle> {
        switch id {
        case "squat": return [.core]
        case "row": return [.biceps, .shoulders]
        case "pulldown": return [.biceps]
        case "press", "pushup": return [.triceps, .shoulders]
        case "shoulderpress": return [.triceps]
        case "hipthrust": return [.hamstrings]
        default: return []
        }
    }
}

@MainActor
struct DailyMapCard: View {
    let records: [WorkoutRecord]
    let date: Date
    private var totals: [String: Int] {
        records.reduce(into: [:]) { result, record in
            for (key, value) in record.sets where value > 0 { result[key, default: 0] += value }
        }
    }
    private var movements: [Movement] { Movement.all.filter { totals[$0.id, default: 0] > 0 } }
    private var primary: Set<Muscle> { movements.reduce(into: Set<Muscle>()) { $0.formUnion($1.primary) } }
    private var secondary: Set<Muscle> {
        movements.reduce(into: Set<Muscle>()) { $0.formUnion($1.secondary) }.subtracting(primary)
    }
    private var classification: String {
        let lower = primary.contains { $0.lower }
        let upper = primary.contains { !$0.lower && $0 != .core }
        if lower && upper { return "Treino misto • superiores e inferiores" }
        if lower { return "Inferiores" }
        if upper { return "Superiores" }
        return primary.isEmpty ? "Sem exercícios registrados" : "Abdômen"
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("CALIBRE").font(.system(.headline, design: .rounded, weight: .black)).foregroundStyle(Palette.green)
                Spacer()
                Text(date, style: .date).font(.caption).foregroundStyle(Palette.muted)
            }
            Text("Seu corpo em movimento").font(.title2.bold())
            Text(classification).font(.headline)
            Text("Resumo de todos os treinos deste dia").font(.caption).foregroundStyle(Palette.muted)
            HStack(alignment: .top, spacing: 20) {
                figure(back: false)
                figure(back: true)
            }
            HStack {
                Label("Principais", systemImage: "circle.fill").foregroundStyle(Palette.green)
                Label("Secundários", systemImage: "circle.fill").foregroundStyle(.orange)
            }.font(.caption.bold())
            muscleList("Principais", muscles: primary)
            if !secondary.isEmpty { muscleList("Secundários", muscles: secondary) }
            Divider()
            Text("\(totals.values.reduce(0, +)) séries • \(records.reduce(0) { $0 + $1.earnedXP }) XP no dia")
                .font(.headline)
            ForEach(movements) { movement in
                HStack(alignment: .top) {
                    Text(movement.name)
                    Spacer()
                    Text("\(totals[movement.id, default: 0]) séries").fontWeight(.semibold)
                }.font(.subheadline)
            }
            Text("Mapa ilustrativo dos grupos associados aos exercícios registrados. Não representa uma medição de ativação muscular. Variações do movimento podem alterar os grupos envolvidos.")
                .font(.caption2).foregroundStyle(Palette.muted)
        }
        .foregroundStyle(Palette.ink).padding(18).background(.white, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Palette.line, lineWidth: 2))
    }
    private func figure(back: Bool) -> some View {
        VStack {
            BodyDiagram(back: back, primary: primary, secondary: secondary)
                .aspectRatio(100.0 / 240.0, contentMode: .fit)
                .accessibilityLabel(back ? "Mapa posterior" : "Mapa anterior")
            Text(back ? "COSTAS" : "FRENTE").font(.caption.bold()).foregroundStyle(Palette.muted)
        }.frame(maxWidth: .infinity)
    }
    private func muscleList(_ title: String, muscles: Set<Muscle>) -> some View {
        Text("\(title): \(Muscle.allCases.filter { muscles.contains($0) }.map(\.rawValue).joined(separator: ", ")).")
            .font(.subheadline)
    }
}

@MainActor
struct BodyDiagram: View {
    let back: Bool
    let primary: Set<Muscle>
    let secondary: Set<Muscle>
    var body: some View {
        Canvas { context, size in
            let sx = size.width / 100
            let sy = size.height / 240
            func rect(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat) -> CGRect {
                CGRect(x: x * sx, y: y * sy, width: w * sx, height: h * sy)
            }
            func paint(_ shape: Path, muscle: Muscle? = nil) {
                let color: Color
                if let muscle, primary.contains(muscle) { color = Palette.green }
                else if let muscle, secondary.contains(muscle) { color = .orange }
                else { color = Color(red: 0.88, green: 0.91, blue: 0.92) }
                context.fill(shape, with: .color(color))
                context.stroke(shape, with: .color(.white), lineWidth: 1.2)
            }
            func capsule(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, muscle: Muscle? = nil) {
                paint(Path(roundedRect: rect(x,y,w,h), cornerRadius: w * sx / 2), muscle: muscle)
            }
            func polygon(_ points: [(CGFloat, CGFloat)], muscle: Muscle? = nil) {
                var path = Path()
                for (index, point) in points.enumerated() {
                    let p = CGPoint(x: point.0 * sx, y: point.1 * sy)
                    if index == 0 { path.move(to: p) } else { path.addLine(to: p) }
                }
                path.closeSubpath()
                paint(path, muscle: muscle)
            }
            paint(Path(ellipseIn: rect(38, 4, 24, 27)))
            capsule(44, 30, 12, 12)
            polygon([(31,40),(69,40),(67,77),(61,105),(67,128),(33,128),(39,105),(33,77)])
            // Silhueta: braços, pernas e pés.
            capsule(21, 46, 13, 45)
            capsule(66, 46, 13, 45)
            capsule(15, 86, 12, 42)
            capsule(73, 86, 12, 42)
            capsule(14, 123, 12, 17)
            capsule(74, 123, 12, 17)
            capsule(33, 123, 16, 58)
            capsule(51, 123, 16, 58)
            capsule(34, 177, 13, 45)
            capsule(53, 177, 13, 45)
            capsule(29, 218, 18, 12)
            capsule(53, 218, 18, 12)
            // Deltoides e braços são mostrados nas duas vistas.
            paint(Path(ellipseIn: rect(23, 40, 15, 19)), muscle: .shoulders)
            paint(Path(ellipseIn: rect(62, 40, 15, 19)), muscle: .shoulders)
            capsule(23, 59, 9, 27, muscle: back ? .triceps : .biceps)
            capsule(68, 59, 9, 27, muscle: back ? .triceps : .biceps)
            if back {
                polygon([(36,42),(49,45),(49,96),(40,90),(35,65)], muscle: .back)
                polygon([(64,42),(51,45),(51,96),(60,90),(65,65)], muscle: .back)
                capsule(35,105,14,25,muscle: .glutes)
                capsule(51,105,14,25,muscle: .glutes)
                capsule(36,132,11,41,muscle: .hamstrings)
                capsule(53,132,11,41,muscle: .hamstrings)
                capsule(36,184,9,29,muscle: .calves)
                capsule(55,184,9,29,muscle: .calves)
            } else {
                polygon([(36,46),(49,47),(49,66),(36,65)], muscle: .chest)
                polygon([(64,46),(51,47),(51,66),(64,65)], muscle: .chest)
                capsule(40,70,20,34,muscle: .core)
                capsule(35,130,12,43,muscle: .quads)
                capsule(53,130,12,43,muscle: .quads)
            }
        }
    }
}


// MARK: - SquatCounter

// Heurística experimental de contagem, não um classificador de execução correta.
// Os ângulos são apenas limiares de detecção, não uma meta de amplitude recomendada.
struct SquatCounter {
    enum Phase { case waiting, standing, lowered }
    private(set) var repetitions = 0
    private(set) var phase: Phase = .waiting
    private(set) var angle: Double?
    private var stableFrames = 0
    private var lastFrame: TimeInterval?
    private var descentTime: TimeInterval?

    mutating func loseTracking() {
        phase = .waiting
        stableFrames = 0
        angle = nil
        lastFrame = nil
        descentTime = nil
    }
    mutating func update(angle raw: Double, at time: TimeInterval) {
        guard raw.isFinite, (0...180).contains(raw) else { loseTracking(); return }
        if let lastFrame, time - lastFrame > 0.65 { loseTracking() }
        lastFrame = time
        let filtered = angle.map { $0 * 0.5 + raw * 0.5 } ?? raw
        angle = filtered
        switch phase {
        case .waiting:
            stableFrames = filtered >= 150 ? stableFrames + 1 : 0
            if stableFrames >= 3 { phase = .standing; stableFrames = 0 }
        case .standing:
            stableFrames = filtered <= 110 ? stableFrames + 1 : 0
            if stableFrames >= 3 {
                phase = .lowered
                stableFrames = 0
                descentTime = time
            }
        case .lowered:
            if let descentTime, time - descentTime > 15 { loseTracking(); return }
            stableFrames = filtered >= 150 ? stableFrames + 1 : 0
            if stableFrames >= 3, let descentTime, time - descentTime >= 0.45 {
                repetitions += 1
                phase = .standing
                stableFrames = 0
                self.descentTime = nil
            }
        }
    }
}


// MARK: - CameraWorkout

struct PoseFrame {
    var image: UIImage?
    // Pontos normalizados com origem no canto inferior esquerdo (Vision).
    var joints: [String: CGPoint] = [:]
    var repetitions = 0
    var kneeAngle: Double?
    var message = "Posicione o iPhone em pé, de lado para o corpo."
    var tracking = false
}

// O estado de captura e o contador são acessados somente pela fila serial queue.
// As propriedades @Published são atualizadas somente na fila principal.
final class PoseCamera: NSObject, ObservableObject, AVCaptureVideoDataOutputSampleBufferDelegate, @unchecked Sendable {
    @Published private(set) var frame = PoseFrame()
    @Published private(set) var problem: String?
    @Published private(set) var permissionDenied = false
    @Published private(set) var running = false
    private let session = AVCaptureSession()
    private let queue = DispatchQueue(label: "calibre.camera.serial", qos: .userInitiated)
    private let context = CIContext()
    private let request = VNDetectHumanBodyPoseRequest()
    private var configured = false
    private var wantsRunning = false
    private var askingPermission = false
    private var counter = SquatCounter()
    private var lastProcessed: TimeInterval = -.infinity
    private var trackedSide: String?
    private var observers: [NSObjectProtocol] = []

    override init() {
        super.init()
        let center = NotificationCenter.default
        observers.append(center.addObserver(forName: AVCaptureSession.wasInterruptedNotification, object: session, queue: nil) { [weak self] _ in
            self?.handleInterruption("Câmera interrompida. Feche outros apps que usam a câmera e toque em Tentar novamente.")
        })
        observers.append(center.addObserver(forName: AVCaptureSession.runtimeErrorNotification, object: session, queue: nil) { [weak self] _ in
            self?.handleInterruption("A câmera encontrou um erro. Toque em Tentar novamente.")
        })
    }
    deinit { observers.forEach { NotificationCenter.default.removeObserver($0) } }

    func start() {
        queue.async { [weak self] in
            guard let self else { return }
            self.wantsRunning = true
            guard let usage = Bundle.main.object(forInfoDictionaryKey: "NSCameraUsageDescription") as? String,
                  !usage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                self.fail("Configure Privacy - Camera Usage Description no target do Xcode antes de usar a câmera.")
                return
            }
            switch AVCaptureDevice.authorizationStatus(for: .video) {
            case .authorized: self.configureAndStart()
            case .notDetermined:
                guard !self.askingPermission else { return }
                self.askingPermission = true
                AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                    guard let self else { return }
                    self.queue.async {
                        self.askingPermission = false
                        guard self.wantsRunning else { return }
                        if granted { self.configureAndStart() }
                        else { self.fail("Permita o acesso à câmera em Ajustes para analisar movimentos.", denied: true) }
                    }
                }
            case .denied, .restricted:
                self.fail("O acesso à câmera não está disponível. Verifique a permissão em Ajustes.", denied: true)
            @unknown default: self.fail("Não foi possível verificar a permissão da câmera.")
            }
        }
    }
    func stop() {
        queue.async { [weak self] in
            guard let self else { return }
            self.wantsRunning = false
            if self.session.isRunning { self.session.stopRunning() }
            self.counter.loseTracking()
            self.trackedSide = nil
            DispatchQueue.main.async {
                self.running = false
                self.frame.image = nil
                self.frame.joints = [:]
                self.frame.tracking = false
                self.frame.kneeAngle = nil
            }
        }
    }
    private func configureAndStart() {
        guard wantsRunning else { return }
        do {
            if !configured { try configure() }
            counter.loseTracking()
            trackedSide = nil
            lastProcessed = -.infinity
            if !session.isRunning { session.startRunning() }
            guard session.isRunning else { fail("A câmera não iniciou. Tente novamente."); return }
            DispatchQueue.main.async {
                self.problem = nil
                self.permissionDenied = false
                self.running = true
            }
        } catch { fail(error.localizedDescription) }
    }
    private func configure() throws {
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
            throw CameraFailure(message: "Não há câmera traseira disponível. Use um iPhone físico; o simulador não oferece esta análise.")
        }
        let input = try AVCaptureDeviceInput(device: device)
        let output = AVCaptureVideoDataOutput()
        output.alwaysDiscardsLateVideoFrames = true
        output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
        session.beginConfiguration()
        defer { session.commitConfiguration() }
        // Uma nova tentativa não acumula entradas/saídas de uma configuração incompleta.
        session.inputs.forEach { session.removeInput($0) }
        session.outputs.forEach { session.removeOutput($0) }
        if session.canSetSessionPreset(.vga640x480) { session.sessionPreset = .vga640x480 }
        guard session.canAddInput(input) else { throw CameraFailure(message: "Não foi possível conectar a câmera.") }
        session.addInput(input)
        guard session.canAddOutput(output) else { throw CameraFailure(message: "Não foi possível receber as imagens da câmera.") }
        session.addOutput(output)
        guard let connection = output.connection(with: .video), connection.isVideoRotationAngleSupported(90) else {
            throw CameraFailure(message: "Este dispositivo não oferece a orientação necessária para o protótipo.")
        }
        // O buffer entregue ao Vision e à imagem já está em retrato; não há espelhamento.
        connection.videoRotationAngle = 90
        if connection.isVideoMirroringSupported { connection.isVideoMirrored = false }
        output.setSampleBufferDelegate(self, queue: queue)
        configured = true
    }
    private func handleInterruption(_ message: String) {
        queue.async { [weak self] in
            guard let self else { return }
            self.wantsRunning = false
            if self.session.isRunning { self.session.stopRunning() }
            self.counter.loseTracking()
            self.trackedSide = nil
            self.fail(message)
        }
    }
    private func fail(_ message: String, denied: Bool = false) {
        DispatchQueue.main.async {
            self.problem = message
            self.permissionDenied = denied
            self.running = false
            self.frame.image = nil
            self.frame.joints = [:]
            self.frame.tracking = false
            self.frame.kneeAngle = nil
        }
    }
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard wantsRunning else { return }
        let time = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
        guard time.isFinite else { return }
        guard time - lastProcessed >= 0.10, let buffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        lastProcessed = time
        autoreleasepool {
            let source = CIImage(cvPixelBuffer: buffer)
            guard let cgImage = context.createCGImage(source, from: source.extent) else { return }
            var next = PoseFrame(image: UIImage(cgImage: cgImage), repetitions: counter.repetitions)
            do {
                try VNImageRequestHandler(cvPixelBuffer: buffer, orientation: .up, options: [:]).perform([request])
                let bodies = request.results ?? []
                guard bodies.count == 1, let body = bodies.first else {
                    lost(&next, message: bodies.isEmpty ? "Não vejo o corpo. Afaste o celular e melhore a iluminação." : "Mantenha apenas uma pessoa no enquadramento.")
                    return
                }
                let names: [(String, VNHumanBodyPoseObservation.JointName)] = [
                    ("leftShoulder", .leftShoulder), ("rightShoulder", .rightShoulder),
                    ("leftElbow", .leftElbow), ("rightElbow", .rightElbow),
                    ("leftWrist", .leftWrist), ("rightWrist", .rightWrist),
                    ("leftHip", .leftHip), ("rightHip", .rightHip),
                    ("leftKnee", .leftKnee), ("rightKnee", .rightKnee),
                    ("leftAnkle", .leftAnkle), ("rightAnkle", .rightAnkle)
                ]
                var confidence: [String: Float] = [:]
                for (name, joint) in names {
                    if let point = try? body.recognizedPoint(joint), point.confidence >= 0.55 {
                        next.joints[name] = point.location
                        confidence[name] = point.confidence
                    }
                }
                func score(_ side: String) -> Float {
                    ["Shoulder", "Hip", "Knee", "Ankle"].map { confidence[side + $0] ?? 0 }.min() ?? 0
                }
                // Não alterna de perna no meio de uma repetição.
                let side = trackedSide ?? (score("left") >= score("right") ? "left" : "right")
                guard score(side) >= 0.55,
                      let hip = next.joints[side + "Hip"], let knee = next.joints[side + "Knee"],
                      let ankle = next.joints[side + "Ankle"] else {
                    lost(&next, message: "Mostre ombro, quadril, joelho e tornozelo de lado. Contagem suspensa.")
                    return
                }
                trackedSide = side
                // Rejeita pontos cortados nas bordas da imagem.
                let visible = [hip, knee, ankle].allSatisfy { (0.03...0.97).contains($0.x) && (0.03...0.97).contains($0.y) }
                guard visible else { lost(&next, message: "Afaste a câmera: há partes do corpo perto da borda."); return }
                let width = CGFloat(CVPixelBufferGetWidth(buffer))
                let height = CGFloat(CVPixelBufferGetHeight(buffer))
                let a = CGVector(dx: (hip.x - knee.x) * width, dy: (hip.y - knee.y) * height)
                let b = CGVector(dx: (ankle.x - knee.x) * width, dy: (ankle.y - knee.y) * height)
                let denominator = hypot(a.dx, a.dy) * hypot(b.dx, b.dy)
                guard denominator > 25 else { lost(&next, message: "Aproxime a câmera para reconhecer os pontos."); return }
                let cosine = max(-1.0, min(1.0, Double((a.dx * b.dx + a.dy * b.dy) / denominator)))
                counter.update(angle: acos(cosine) * 180 / .pi, at: time)
                next.kneeAngle = counter.angle
                next.repetitions = counter.repetitions
                next.tracking = true
                switch counter.phase {
                case .waiting: next.message = "Fique em pé para iniciar a contagem."
                case .standing: next.message = "Posição em pé detectada. Siga o seu plano."
                case .lowered: next.message = "Flexão detectada. Aguardando o retorno à posição em pé."
                }
                publish(next)
            } catch { lost(&next, message: "Não foi possível analisar este quadro. Ajuste a posição e a luz.") }
        }
    }
    private func lost(_ next: inout PoseFrame, message: String) {
        counter.loseTracking()
        trackedSide = nil
        next.message = message
        next.tracking = false
        next.kneeAngle = nil
        next.joints = [:]
        publish(next)
    }
    private func publish(_ next: PoseFrame) {
        DispatchQueue.main.async { self.frame = next }
    }
}

struct CameraFailure: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

@MainActor
struct CameraWorkoutView: View {
    let onConfirmSet: (Int) -> Void
    @StateObject private var camera = PoseCamera()
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @State private var didConfirm = false
    @State private var confirm = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Agachamento • experimental").font(.title2.bold())
                    Text("Apoie o iPhone em pé, com a câmera traseira de lado para você. Enquadre o corpo inteiro e fique sozinho na imagem.")
                        .font(.callout)
                    PosePreview(frame: camera.frame)
                        .aspectRatio(3.0 / 4.0, contentMode: .fit)
                        .background(.black, in: RoundedRectangle(cornerRadius: 18))
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                    if let problem = camera.problem {
                        Text(problem).foregroundStyle(.orange)
                        if camera.permissionDenied {
                            Button("Abrir Ajustes") {
                                if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
                            }
                        } else { Button("Tentar novamente") { camera.start() } }
                    } else {
                        Text(camera.frame.message).font(.headline)
                    }
                    HStack {
                        StatItem(value: "\(camera.frame.repetitions)", label: "Repetições estimadas", icon: "repeat", color: Palette.green)
                        StatItem(value: camera.frame.kneeAngle.map { "\(Int($0))°" } ?? "—", label: "Ângulo 2D do joelho", icon: "angle", color: .blue)
                    }
                    Text("A câmera estima movimentos; não confirma execução correta, segurança ou ativação muscular. A contagem pode falhar por perspectiva, roupa ou oclusão. Não altere sua amplitude para atingir os limiares do app.")
                        .font(.footnote).foregroundStyle(.secondary)
                    Text("Processamento no aparelho, sem gravar ou enviar vídeo. Confirme manualmente a série realizada.")
                        .font(.footnote).foregroundStyle(.secondary)
                    Button("REGISTRAR 1 SÉRIE") { confirm = true }
                        .buttonStyle(GreenButtonStyle())
                        .disabled(camera.frame.repetitions == 0 || didConfirm)
                    Text("Se a câmera não contar, volte e registre a série manualmente. As repetições estimadas não geram XP adicional.")
                        .font(.caption).foregroundStyle(.secondary)
                }.padding()
            }
            .navigationTitle("Câmera").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Voltar") { dismiss() } } }
            .confirmationDialog("Você concluiu esta série?", isPresented: $confirm, titleVisibility: .visible) {
                Button("Sim, registrar 1 série") {
                    guard !didConfirm else { return }
                    didConfirm = true
                    onConfirmSet(camera.frame.repetitions)
                    camera.stop()
                    dismiss()
                }
                Button("Continuar", role: .cancel) { }
            } message: { Text("A contagem é uma estimativa. Confirme apenas o exercício que você realmente realizou.") }
        }
        .onAppear { camera.start() }
        .onDisappear { camera.stop() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { camera.start() } else { camera.stop() }
        }
    }
}

@MainActor
struct PosePreview: View {
    let frame: PoseFrame
    private let edges = [
        ("leftShoulder","rightShoulder"), ("leftShoulder","leftElbow"), ("leftElbow","leftWrist"),
        ("rightShoulder","rightElbow"), ("rightElbow","rightWrist"),
        ("leftShoulder","leftHip"), ("rightShoulder","rightHip"), ("leftHip","rightHip"),
        ("leftHip","leftKnee"), ("leftKnee","leftAnkle"),
        ("rightHip","rightKnee"), ("rightKnee","rightAnkle")
    ]
    var body: some View {
        GeometryReader { geometry in
            if let image = frame.image {
                let scale = min(geometry.size.width / image.size.width, geometry.size.height / image.size.height)
                let width = image.size.width * scale
                let height = image.size.height * scale
                ZStack {
                    Image(uiImage: image).resizable().scaledToFit()
                    Canvas { context, size in
                        func point(_ name: String) -> CGPoint? {
                            guard let p = frame.joints[name] else { return nil }
                            return CGPoint(x: p.x * size.width, y: (1 - p.y) * size.height)
                        }
                        for (a,b) in edges {
                            if let start = point(a), let end = point(b) {
                                var path = Path(); path.move(to: start); path.addLine(to: end)
                                context.stroke(path, with: .color(.cyan), style: StrokeStyle(lineWidth: 3, lineCap: .round))
                            }
                        }
                        for name in frame.joints.keys {
                            if let p = point(name) {
                                context.fill(Path(ellipseIn: CGRect(x: p.x - 4, y: p.y - 4, width: 8, height: 8)), with: .color(.yellow))
                            }
                        }
                    }
                }.frame(width: width, height: height).position(x: geometry.size.width / 2, y: geometry.size.height / 2)
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "camera.fill").font(.largeTitle)
                    Text("Câmera do iPhone").font(.headline)
                    Text("Mostre o corpo inteiro, de lado.").font(.caption)
                }.foregroundStyle(.white).frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }.accessibilityLabel("Imagem da câmera com pontos corporais estimados")
    }
}
