declare module 'pgsql-parser';

// https://gist.github.com/wesselvdv/c18d39550561bb5b76c7ebef1b82aac4
declare module 'libpg-query' {
  interface ParseResult {
    version: number;
    stmts: Array<RawStmt>;
  }

  type PlPgParseResult = Array<{
    PLpgSQL_function: PLpgSQL_function;
  }>;

  interface ScanResult {
    version: number;
    tokens: Array<ScanToken>;
  }

  interface PLpgSQL_function {
    new_varno?: number;
    old_varno?: number;
    datums: Array<
      | OneOfPLpgSQL_var
      | OneOfPLpgSQL_row
      | OneOfPLpgSQL_rec
      | OneOfPLpgSQL_recfield
      | OneOfPLpgSQL_arrayelem
    >;
    action?: OneOfPLpgSQL_stmt_block;
  }

  interface PLpgSQL_var {
    refname: string;
    lineno?: number;
    datatype: OneOfPLpgSQL_type;
    isconst?: boolean;
    notnull?: boolean;
    default_val?: OneOfPLpgSQL_expr;
    cursor_explicit_expr?: OneOfPLpgSQL_expr;
    cursor_explicit_argrow?: number;
    cursor_options?: number;
  }

  interface PLpgSQL_row {
    refname: string;
    lineno: number;
    fields: Array<{
      name: string;
      varno: number;
    }>;
  }

  interface PLpgSQL_rec {
    refname: string;
    dno: number;
    lineno?: number;
  }

  interface PLpgSQL_recfield {
    fieldname: string;
    recparentno: number;
  }

  interface PLpgSQL_arrayelem {
    subscript: OneOfPLpgSQL_expr;
    arrayparentno: number;
  }

  interface PLpgSQL_type {
    typname: string;
  }

  interface PLpgSQL_expr {
    query: string;
  }

  type PLpgSQL_variable =
    | OneOfPLpgSQL_var
    | OneOfPLpgSQL_row
    | OneOfPLpgSQL_rec;

  interface PLpgSQL_diag_item {
    kind: string;
    target: number;
  }

  interface PLpgSQL_stmt_dynfors {
    lineno: number;
    label?: string;
    var: PLpgSQL_variable;
    body: Array<PLpgSQL_stmt>;
    query: OneOfPLpgSQL_expr;
    params?: Array<OneOfPLpgSQL_expr>;
  }

  interface PLpgSQL_stmt_dynexecute {
    lineno: number;
    query: OneOfPLpgSQL_expr;
    into?: boolean;
    strict?: boolean;
    target?: PLpgSQL_variable;
    params?: Array<OneOfPLpgSQL_expr>;
  }

  interface PLpgSQL_stmt_execsql {
    lineno: number;
    sqlstmt: OneOfPLpgSQL_expr;
    into?: boolean;
    strict?: boolean;
    target?: PLpgSQL_variable;
  }

  interface PLpgSQL_stmt_assert {
    lineno: number;
    cond: OneOfPLpgSQL_expr;
    message: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_raise_option {
    opt_type: number; // actually enum;
    expr: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_stmt_raise {
    lineno: number;
    elog_level: number;
    condname?: string;
    message: string;
    params?: Array<OneOfPLpgSQL_expr>;
    options?: Array<OneOfPLpgSQL_raise_option>;
  }

  interface PLpgSQL_stmt_return_query {
    lineno: number;
    query: OneOfPLpgSQL_expr;
    dynquery?: OneOfPLpgSQL_expr;
    params?: Array<OneOfPLpgSQL_expr>;
  }

  interface PLpgSQL_stmt_return_next {
    lineno: number;
    expr?: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_stmt_return {
    lineno?: number;
    expr?: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_stmt_exit {
    lineno: number;
    is_exit: boolean;
    label?: string;
    cond?: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_stmt_set {
    lineno: number;
    expr: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_stmt_rollback {
    lineno: number;
    chain: boolean;
  }

  interface PLpgSQL_stmt_commit {
    lineno: number;
    chain: boolean;
  }

  interface PLpgSQL_stmt_call {
    lineno: number;
    expr: OneOfPLpgSQL_expr;
    is_call: boolean;
    target: PLpgSQL_variable;
  }

  interface PLpgSQL_stmt_perform {
    lineno: number;
    expr: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_stmt_close {
    lineno: number;
    curvar: number;
  }

  interface PLpgSQL_stmt_fetch {
    lineno: number;
    target: PLpgSQL_variable;
    curvar: number;
    direction: number; // actually enum;
    howmany: number;
    expr: OneOfPLpgSQL_expr;
    is_move: boolean;
    returns_multiple_rows: boolean;
  }

  interface PLpgSQL_stmt_open {
    lineno: number;
    curvar: number;
    cursor_options: number;
    argquery: OneOfPLpgSQL_expr;
    query: OneOfPLpgSQL_expr;
    dynquery: OneOfPLpgSQL_expr;
    params: Array<OneOfPLpgSQL_expr>;
  }

  interface PLpgSQL_stmt_foreach_a {
    lineno: number;
    label: string;
    varno: number;
    slice: number;
    expr: OneOfPLpgSQL_expr;
    body: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_stmt_forc {
    lineno: number;
    label: string;
    var: PLpgSQL_variable;
    body: Array<PLpgSQL_stmt>;
    curvar: number;
    argquery: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_stmt_fors {
    lineno: number;
    label?: string;
    var: PLpgSQL_variable;
    body: Array<PLpgSQL_stmt>;
    query: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_stmt_fori {
    lineno: number;
    label?: string;
    var: PLpgSQL_variable;
    lower: OneOfPLpgSQL_expr;
    upper: OneOfPLpgSQL_expr;
    step?: OneOfPLpgSQL_expr;
    reverse?: boolean;
    body: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_stmt_while {
    lineno: number;
    label?: string;
    cond: OneOfPLpgSQL_expr;
    body: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_stmt_loop {
    lineno: number;
    label: string;
    body: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_case_when {
    lineno: number;
    expr: OneOfPLpgSQL_expr;
    stmts: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_stmt_case {
    lineno: number;
    t_expr: OneOfPLpgSQL_expr;
    t_varno: number;
    case_when_list: Array<OneOfPLpgSQL_case_when>;
    have_else: boolean;
    else_stmts: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_if_elsif {
    lineno: number;
    cond: OneOfPLpgSQL_expr;
    stmts: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_stmt_if {
    lineno: number;
    cond: OneOfPLpgSQL_expr;
    then_body: Array<PLpgSQL_stmt>;
    elsif_list?: Array<OneOfPLpgSQL_if_elsif>;
    else_body?: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_stmt_assign {
    lineno: number;
    varno: number;
    expr: OneOfPLpgSQL_expr;
  }

  interface PLpgSQL_condition {
    condname: string;
  }

  interface PLpgSQL_exception {
    conditions: Array<OneOfPLpgSQL_condition>;
    action?: Array<PLpgSQL_stmt>;
  }

  interface PLpgSQL_exception_block {
    exc_list: Array<OneOfPLpgSQL_exception>;
  }

  interface PLpgSQL_stmt_block {
    lineno?: number;
    label?: string;
    body: Array<PLpgSQL_stmt>;
    exceptions?: OneOfPLpgSQL_exception_block;
  }

  type PLpgSQL_stmt =
    | OneOfPLpgSQL_stmt_block
    | OneOfPLpgSQL_stmt_assign
    | OneOfPLpgSQL_stmt_if
    | OneOfPLpgSQL_stmt_case
    | OneOfPLpgSQL_stmt_loop
    | OneOfPLpgSQL_stmt_while
    | OneOfPLpgSQL_stmt_fori
    | OneOfPLpgSQL_stmt_fors
    | OneOfPLpgSQL_stmt_forc
    | OneOfPLpgSQL_stmt_foreach_a
    | OneOfPLpgSQL_stmt_exit
    | OneOfPLpgSQL_stmt_return
    | OneOfPLpgSQL_stmt_return_next
    | OneOfPLpgSQL_stmt_return_query
    | OneOfPLpgSQL_stmt_raise
    | OneOfPLpgSQL_stmt_assert
    | OneOfPLpgSQL_stmt_execsql
    | OneOfPLpgSQL_stmt_dynexecute
    | OneOfPLpgSQL_stmt_dynfors
    | OneOfPLpgSQL_stmt_getdiag
    | OneOfPLpgSQL_stmt_open
    | OneOfPLpgSQL_stmt_fetch
    | OneOfPLpgSQL_stmt_close
    | OneOfPLpgSQL_stmt_perform
    | OneOfPLpgSQL_stmt_call
    | OneOfPLpgSQL_stmt_commit
    | OneOfPLpgSQL_stmt_rollback
    | OneOfPLpgSQL_stmt_set;

  interface PLpgSQL_stmt_getdiag {
    lineno: number;
    is_stacked?: boolean;
    diag_items: Array<OneOfPLpgSQL_diag_item>;
  }

  interface OneOfPLpgSQL_var {
    PLpgSQL_var: PLpgSQL_var;
  }
  interface OneOfPLpgSQL_row {
    PLpgSQL_row: PLpgSQL_row;
  }
  interface OneOfPLpgSQL_rec {
    PLpgSQL_rec: PLpgSQL_rec;
  }
  interface OneOfPLpgSQL_recfield {
    PLpgSQL_recfield: PLpgSQL_recfield;
  }
  interface OneOfPLpgSQL_arrayelem {
    PLpgSQL_arrayelem: PLpgSQL_arrayelem;
  }
  interface OneOfPLpgSQL_type {
    PLpgSQL_type: PLpgSQL_type;
  }
  interface OneOfPLpgSQL_expr {
    PLpgSQL_expr: PLpgSQL_expr;
  }
  interface OneOfPLpgSQL_diag_item {
    PLpgSQL_diag_item: PLpgSQL_diag_item;
  }
  interface OneOfPLpgSQL_stmt_getdiag {
    PLpgSQL_stmt_getdiag: PLpgSQL_stmt_getdiag;
  }
  interface OneOfPLpgSQL_stmt_dynfors {
    PLpgSQL_stmt_dynfors: PLpgSQL_stmt_dynfors;
  }
  interface OneOfPLpgSQL_stmt_dynexecute {
    PLpgSQL_stmt_dynexecute: PLpgSQL_stmt_dynexecute;
  }
  interface OneOfPLpgSQL_stmt_execsql {
    PLpgSQL_stmt_execsql: PLpgSQL_stmt_execsql;
  }
  interface OneOfPLpgSQL_stmt_assert {
    PLpgSQL_stmt_assert: PLpgSQL_stmt_assert;
  }
  interface OneOfPLpgSQL_raise_option {
    PLpgSQL_raise_option: PLpgSQL_raise_option;
  }
  interface OneOfPLpgSQL_stmt_raise {
    PLpgSQL_stmt_raise: PLpgSQL_stmt_raise;
  }
  interface OneOfPLpgSQL_stmt_return_query {
    PLpgSQL_stmt_return_query: PLpgSQL_stmt_return_query;
  }
  interface OneOfPLpgSQL_stmt_return_next {
    PLpgSQL_stmt_return_next: PLpgSQL_stmt_return_next;
  }
  interface OneOfPLpgSQL_stmt_return {
    PLpgSQL_stmt_return: PLpgSQL_stmt_return;
  }
  interface OneOfPLpgSQL_stmt_exit {
    PLpgSQL_stmt_exit: PLpgSQL_stmt_exit;
  }
  interface OneOfPLpgSQL_stmt_set {
    PLpgSQL_stmt_set: PLpgSQL_stmt_set;
  }
  interface OneOfPLpgSQL_stmt_rollback {
    PLpgSQL_stmt_rollback: PLpgSQL_stmt_rollback;
  }
  interface OneOfPLpgSQL_stmt_commit {
    PLpgSQL_stmt_commit: PLpgSQL_stmt_commit;
  }
  interface OneOfPLpgSQL_stmt_call {
    PLpgSQL_stmt_call: PLpgSQL_stmt_call;
  }
  interface OneOfPLpgSQL_stmt_perform {
    PLpgSQL_stmt_perform: PLpgSQL_stmt_perform;
  }
  interface OneOfPLpgSQL_stmt_close {
    PLpgSQL_stmt_close: PLpgSQL_stmt_close;
  }
  interface OneOfPLpgSQL_stmt_fetch {
    PLpgSQL_stmt_fetch: PLpgSQL_stmt_fetch;
  }
  interface OneOfPLpgSQL_stmt_open {
    PLpgSQL_stmt_open: PLpgSQL_stmt_open;
  }
  interface OneOfPLpgSQL_stmt_foreach_a {
    PLpgSQL_stmt_foreach_a: PLpgSQL_stmt_foreach_a;
  }
  interface OneOfPLpgSQL_stmt_forc {
    PLpgSQL_stmt_forc: PLpgSQL_stmt_forc;
  }
  interface OneOfPLpgSQL_stmt_fors {
    PLpgSQL_stmt_fors: PLpgSQL_stmt_fors;
  }
  interface OneOfPLpgSQL_stmt_fori {
    PLpgSQL_stmt_fori: PLpgSQL_stmt_fori;
  }
  interface OneOfPLpgSQL_stmt_while {
    PLpgSQL_stmt_while: PLpgSQL_stmt_while;
  }
  interface OneOfPLpgSQL_stmt_loop {
    PLpgSQL_stmt_loop: PLpgSQL_stmt_loop;
  }
  interface OneOfPLpgSQL_case_when {
    PLpgSQL_case_when: PLpgSQL_case_when;
  }
  interface OneOfPLpgSQL_stmt_case {
    PLpgSQL_stmt_case: PLpgSQL_stmt_case;
  }
  interface OneOfPLpgSQL_if_elsif {
    PLpgSQL_if_elsif: PLpgSQL_if_elsif;
  }
  interface OneOfPLpgSQL_stmt_if {
    PLpgSQL_stmt_if: PLpgSQL_stmt_if;
  }
  interface OneOfPLpgSQL_stmt_assign {
    PLpgSQL_stmt_assign: PLpgSQL_stmt_assign;
  }
  interface OneOfPLpgSQL_condition {
    PLpgSQL_condition: PLpgSQL_condition;
  }
  interface OneOfPLpgSQL_exception {
    PLpgSQL_exception: PLpgSQL_exception;
  }
  interface OneOfPLpgSQL_exception_block {
    PLpgSQL_exception_block: PLpgSQL_exception_block;
  }
  interface OneOfPLpgSQL_stmt_block {
    PLpgSQL_stmt_block: PLpgSQL_stmt_block;
  }

  interface OneOfAlias {
    Alias: Alias;
  }
  interface OneOfRangeVar {
    RangeVar: RangeVar;
  }
  interface OneOfTableFunc {
    TableFunc: TableFunc;
  }
  interface OneOfExpr {
    Expr: Expr;
  }
  interface OneOfVar {
    Var: Var;
  }
  interface OneOfParam {
    Param: Param;
  }
  interface OneOfAggref {
    Aggref: Aggref;
  }
  interface OneOfGroupingFunc {
    GroupingFunc: GroupingFunc;
  }
  interface OneOfWindowFunc {
    WindowFunc: WindowFunc;
  }
  interface OneOfSubscriptingRef {
    SubscriptingRef: SubscriptingRef;
  }
  interface OneOfFuncExpr {
    FuncExpr: FuncExpr;
  }
  interface OneOfNamedArgExpr {
    NamedArgExpr: NamedArgExpr;
  }
  interface OneOfOpExpr {
    OpExpr: OpExpr;
  }
  interface OneOfDistinctExpr {
    DistinctExpr: DistinctExpr;
  }
  interface OneOfNullIfExpr {
    NullIfExpr: NullIfExpr;
  }
  interface OneOfScalarArrayOpExpr {
    ScalarArrayOpExpr: ScalarArrayOpExpr;
  }
  interface OneOfBoolExpr {
    BoolExpr: BoolExpr;
  }
  interface OneOfSubLink {
    SubLink: SubLink;
  }
  interface OneOfSubPlan {
    SubPlan: SubPlan;
  }
  interface OneOfAlternativeSubPlan {
    AlternativeSubPlan: AlternativeSubPlan;
  }
  interface OneOfFieldSelect {
    FieldSelect: FieldSelect;
  }
  interface OneOfFieldStore {
    FieldStore: FieldStore;
  }
  interface OneOfRelabelType {
    RelabelType: RelabelType;
  }
  interface OneOfCoerceViaIO {
    CoerceViaIO: CoerceViaIO;
  }
  interface OneOfArrayCoerceExpr {
    ArrayCoerceExpr: ArrayCoerceExpr;
  }
  interface OneOfConvertRowtypeExpr {
    ConvertRowtypeExpr: ConvertRowtypeExpr;
  }
  interface OneOfCollateExpr {
    CollateExpr: CollateExpr;
  }
  interface OneOfCaseExpr {
    CaseExpr: CaseExpr;
  }
  interface OneOfCaseWhen {
    CaseWhen: CaseWhen;
  }
  interface OneOfCaseTestExpr {
    CaseTestExpr: CaseTestExpr;
  }
  interface OneOfArrayExpr {
    ArrayExpr: ArrayExpr;
  }
  interface OneOfRowExpr {
    RowExpr: RowExpr;
  }
  interface OneOfRowCompareExpr {
    RowCompareExpr: RowCompareExpr;
  }
  interface OneOfCoalesceExpr {
    CoalesceExpr: CoalesceExpr;
  }
  interface OneOfMinMaxExpr {
    MinMaxExpr: MinMaxExpr;
  }
  interface OneOfSQLValueFunction {
    SQLValueFunction: SQLValueFunction;
  }
  interface OneOfXmlExpr {
    XmlExpr: XmlExpr;
  }
  interface OneOfNullTest {
    NullTest: NullTest;
  }
  interface OneOfBooleanTest {
    BooleanTest: BooleanTest;
  }
  interface OneOfCoerceToDomain {
    CoerceToDomain: CoerceToDomain;
  }
  interface OneOfCoerceToDomainValue {
    CoerceToDomainValue: CoerceToDomainValue;
  }
  interface OneOfSetToDefault {
    SetToDefault: SetToDefault;
  }
  interface OneOfCurrentOfExpr {
    CurrentOfExpr: CurrentOfExpr;
  }
  interface OneOfNextValueExpr {
    NextValueExpr: NextValueExpr;
  }
  interface OneOfInferenceElem {
    InferenceElem: InferenceElem;
  }
  interface OneOfTargetEntry {
    TargetEntry: TargetEntry;
  }
  interface OneOfRangeTblRef {
    RangeTblRef: RangeTblRef;
  }
  interface OneOfJoinExpr {
    JoinExpr: JoinExpr;
  }
  interface OneOfFromExpr {
    FromExpr: FromExpr;
  }
  interface OneOfOnConflictExpr {
    OnConflictExpr: OnConflictExpr;
  }
  interface OneOfIntoClause {
    IntoClause: IntoClause;
  }
  interface OneOfRawStmt {
    RawStmt: RawStmt;
  }
  interface OneOfQuery {
    Query: Query;
  }
  interface OneOfInsertStmt {
    InsertStmt: InsertStmt;
  }
  interface OneOfDeleteStmt {
    DeleteStmt: DeleteStmt;
  }
  interface OneOfUpdateStmt {
    UpdateStmt: UpdateStmt;
  }
  interface OneOfSelectStmt {
    SelectStmt: SelectStmt;
  }
  interface OneOfAlterTableStmt {
    AlterTableStmt: AlterTableStmt;
  }
  interface OneOfAlterTableCmd {
    AlterTableCmd: AlterTableCmd;
  }
  interface OneOfAlterDomainStmt {
    AlterDomainStmt: AlterDomainStmt;
  }
  interface OneOfSetOperationStmt {
    SetOperationStmt: SetOperationStmt;
  }
  interface OneOfGrantStmt {
    GrantStmt: GrantStmt;
  }
  interface OneOfGrantRoleStmt {
    GrantRoleStmt: GrantRoleStmt;
  }
  interface OneOfAlterDefaultPrivilegesStmt {
    AlterDefaultPrivilegesStmt: AlterDefaultPrivilegesStmt;
  }
  interface OneOfClosePortalStmt {
    ClosePortalStmt: ClosePortalStmt;
  }
  interface OneOfClusterStmt {
    ClusterStmt: ClusterStmt;
  }
  interface OneOfCopyStmt {
    CopyStmt: CopyStmt;
  }
  interface OneOfCreateStmt {
    CreateStmt: CreateStmt;
  }
  interface OneOfDefineStmt {
    DefineStmt: DefineStmt;
  }
  interface OneOfDropStmt {
    DropStmt: DropStmt;
  }
  interface OneOfTruncateStmt {
    TruncateStmt: TruncateStmt;
  }
  interface OneOfCommentStmt {
    CommentStmt: CommentStmt;
  }
  interface OneOfFetchStmt {
    FetchStmt: FetchStmt;
  }
  interface OneOfIndexStmt {
    IndexStmt: IndexStmt;
  }
  interface OneOfCreateFunctionStmt {
    CreateFunctionStmt: CreateFunctionStmt;
  }
  interface OneOfAlterFunctionStmt {
    AlterFunctionStmt: AlterFunctionStmt;
  }
  interface OneOfDoStmt {
    DoStmt: DoStmt;
  }
  interface OneOfRenameStmt {
    RenameStmt: RenameStmt;
  }
  interface OneOfRuleStmt {
    RuleStmt: RuleStmt;
  }
  interface OneOfNotifyStmt {
    NotifyStmt: NotifyStmt;
  }
  interface OneOfListenStmt {
    ListenStmt: ListenStmt;
  }
  interface OneOfUnlistenStmt {
    UnlistenStmt: UnlistenStmt;
  }
  interface OneOfTransactionStmt {
    TransactionStmt: TransactionStmt;
  }
  interface OneOfViewStmt {
    ViewStmt: ViewStmt;
  }
  interface OneOfLoadStmt {
    LoadStmt: LoadStmt;
  }
  interface OneOfCreateDomainStmt {
    CreateDomainStmt: CreateDomainStmt;
  }
  interface OneOfCreatedbStmt {
    CreatedbStmt: CreatedbStmt;
  }
  interface OneOfDropdbStmt {
    DropdbStmt: DropdbStmt;
  }
  interface OneOfVacuumStmt {
    VacuumStmt: VacuumStmt;
  }
  interface OneOfExplainStmt {
    ExplainStmt: ExplainStmt;
  }
  interface OneOfCreateTableAsStmt {
    CreateTableAsStmt: CreateTableAsStmt;
  }
  interface OneOfCreateSeqStmt {
    CreateSeqStmt: CreateSeqStmt;
  }
  interface OneOfAlterSeqStmt {
    AlterSeqStmt: AlterSeqStmt;
  }
  interface OneOfVariableSetStmt {
    VariableSetStmt: VariableSetStmt;
  }
  interface OneOfVariableShowStmt {
    VariableShowStmt: VariableShowStmt;
  }
  interface OneOfDiscardStmt {
    DiscardStmt: DiscardStmt;
  }
  interface OneOfCreateTrigStmt {
    CreateTrigStmt: CreateTrigStmt;
  }
  interface OneOfCreatePLangStmt {
    CreatePLangStmt: CreatePLangStmt;
  }
  interface OneOfCreateRoleStmt {
    CreateRoleStmt: CreateRoleStmt;
  }
  interface OneOfAlterRoleStmt {
    AlterRoleStmt: AlterRoleStmt;
  }
  interface OneOfDropRoleStmt {
    DropRoleStmt: DropRoleStmt;
  }
  interface OneOfLockStmt {
    LockStmt: LockStmt;
  }
  interface OneOfConstraintsSetStmt {
    ConstraintsSetStmt: ConstraintsSetStmt;
  }
  interface OneOfReindexStmt {
    ReindexStmt: ReindexStmt;
  }
  interface OneOfCheckPointStmt {
    CheckPointStmt: CheckPointStmt;
  }
  interface OneOfCreateSchemaStmt {
    CreateSchemaStmt: CreateSchemaStmt;
  }
  interface OneOfAlterDatabaseStmt {
    AlterDatabaseStmt: AlterDatabaseStmt;
  }
  interface OneOfAlterDatabaseSetStmt {
    AlterDatabaseSetStmt: AlterDatabaseSetStmt;
  }
  interface OneOfAlterRoleSetStmt {
    AlterRoleSetStmt: AlterRoleSetStmt;
  }
  interface OneOfCreateConversionStmt {
    CreateConversionStmt: CreateConversionStmt;
  }
  interface OneOfCreateCastStmt {
    CreateCastStmt: CreateCastStmt;
  }
  interface OneOfCreateOpClassStmt {
    CreateOpClassStmt: CreateOpClassStmt;
  }
  interface OneOfCreateOpFamilyStmt {
    CreateOpFamilyStmt: CreateOpFamilyStmt;
  }
  interface OneOfAlterOpFamilyStmt {
    AlterOpFamilyStmt: AlterOpFamilyStmt;
  }
  interface OneOfPrepareStmt {
    PrepareStmt: PrepareStmt;
  }
  interface OneOfExecuteStmt {
    ExecuteStmt: ExecuteStmt;
  }
  interface OneOfDeallocateStmt {
    DeallocateStmt: DeallocateStmt;
  }
  interface OneOfDeclareCursorStmt {
    DeclareCursorStmt: DeclareCursorStmt;
  }
  interface OneOfCreateTableSpaceStmt {
    CreateTableSpaceStmt: CreateTableSpaceStmt;
  }
  interface OneOfDropTableSpaceStmt {
    DropTableSpaceStmt: DropTableSpaceStmt;
  }
  interface OneOfAlterObjectDependsStmt {
    AlterObjectDependsStmt: AlterObjectDependsStmt;
  }
  interface OneOfAlterObjectSchemaStmt {
    AlterObjectSchemaStmt: AlterObjectSchemaStmt;
  }
  interface OneOfAlterOwnerStmt {
    AlterOwnerStmt: AlterOwnerStmt;
  }
  interface OneOfAlterOperatorStmt {
    AlterOperatorStmt: AlterOperatorStmt;
  }
  interface OneOfAlterTypeStmt {
    AlterTypeStmt: AlterTypeStmt;
  }
  interface OneOfDropOwnedStmt {
    DropOwnedStmt: DropOwnedStmt;
  }
  interface OneOfReassignOwnedStmt {
    ReassignOwnedStmt: ReassignOwnedStmt;
  }
  interface OneOfCompositeTypeStmt {
    CompositeTypeStmt: CompositeTypeStmt;
  }
  interface OneOfCreateEnumStmt {
    CreateEnumStmt: CreateEnumStmt;
  }
  interface OneOfCreateRangeStmt {
    CreateRangeStmt: CreateRangeStmt;
  }
  interface OneOfAlterEnumStmt {
    AlterEnumStmt: AlterEnumStmt;
  }
  interface OneOfAlterTSDictionaryStmt {
    AlterTSDictionaryStmt: AlterTSDictionaryStmt;
  }
  interface OneOfAlterTSConfigurationStmt {
    AlterTSConfigurationStmt: AlterTSConfigurationStmt;
  }
  interface OneOfCreateFdwStmt {
    CreateFdwStmt: CreateFdwStmt;
  }
  interface OneOfAlterFdwStmt {
    AlterFdwStmt: AlterFdwStmt;
  }
  interface OneOfCreateForeignServerStmt {
    CreateForeignServerStmt: CreateForeignServerStmt;
  }
  interface OneOfAlterForeignServerStmt {
    AlterForeignServerStmt: AlterForeignServerStmt;
  }
  interface OneOfCreateUserMappingStmt {
    CreateUserMappingStmt: CreateUserMappingStmt;
  }
  interface OneOfAlterUserMappingStmt {
    AlterUserMappingStmt: AlterUserMappingStmt;
  }
  interface OneOfDropUserMappingStmt {
    DropUserMappingStmt: DropUserMappingStmt;
  }
  interface OneOfAlterTableSpaceOptionsStmt {
    AlterTableSpaceOptionsStmt: AlterTableSpaceOptionsStmt;
  }
  interface OneOfAlterTableMoveAllStmt {
    AlterTableMoveAllStmt: AlterTableMoveAllStmt;
  }
  interface OneOfSecLabelStmt {
    SecLabelStmt: SecLabelStmt;
  }
  interface OneOfCreateForeignTableStmt {
    CreateForeignTableStmt: CreateForeignTableStmt;
  }
  interface OneOfImportForeignSchemaStmt {
    ImportForeignSchemaStmt: ImportForeignSchemaStmt;
  }
  interface OneOfCreateExtensionStmt {
    CreateExtensionStmt: CreateExtensionStmt;
  }
  interface OneOfAlterExtensionStmt {
    AlterExtensionStmt: AlterExtensionStmt;
  }
  interface OneOfAlterExtensionContentsStmt {
    AlterExtensionContentsStmt: AlterExtensionContentsStmt;
  }
  interface OneOfCreateEventTrigStmt {
    CreateEventTrigStmt: CreateEventTrigStmt;
  }
  interface OneOfAlterEventTrigStmt {
    AlterEventTrigStmt: AlterEventTrigStmt;
  }
  interface OneOfRefreshMatViewStmt {
    RefreshMatViewStmt: RefreshMatViewStmt;
  }
  interface OneOfReplicaIdentityStmt {
    ReplicaIdentityStmt: ReplicaIdentityStmt;
  }
  interface OneOfAlterSystemStmt {
    AlterSystemStmt: AlterSystemStmt;
  }
  interface OneOfCreatePolicyStmt {
    CreatePolicyStmt: CreatePolicyStmt;
  }
  interface OneOfAlterPolicyStmt {
    AlterPolicyStmt: AlterPolicyStmt;
  }
  interface OneOfCreateTransformStmt {
    CreateTransformStmt: CreateTransformStmt;
  }
  interface OneOfCreateAmStmt {
    CreateAmStmt: CreateAmStmt;
  }
  interface OneOfCreatePublicationStmt {
    CreatePublicationStmt: CreatePublicationStmt;
  }
  interface OneOfAlterPublicationStmt {
    AlterPublicationStmt: AlterPublicationStmt;
  }
  interface OneOfCreateSubscriptionStmt {
    CreateSubscriptionStmt: CreateSubscriptionStmt;
  }
  interface OneOfAlterSubscriptionStmt {
    AlterSubscriptionStmt: AlterSubscriptionStmt;
  }
  interface OneOfDropSubscriptionStmt {
    DropSubscriptionStmt: DropSubscriptionStmt;
  }
  interface OneOfCreateStatsStmt {
    CreateStatsStmt: CreateStatsStmt;
  }
  interface OneOfAlterCollationStmt {
    AlterCollationStmt: AlterCollationStmt;
  }
  interface OneOfCallStmt {
    CallStmt: CallStmt;
  }
  interface OneOfAlterStatsStmt {
    AlterStatsStmt: AlterStatsStmt;
  }
  interface OneOfA_Expr {
    A_Expr: A_Expr;
  }
  interface OneOfColumnRef {
    ColumnRef: ColumnRef;
  }
  interface OneOfParamRef {
    ParamRef: ParamRef;
  }
  interface OneOfA_Const {
    A_Const: A_Const;
  }
  interface OneOfFuncCall {
    FuncCall: FuncCall;
  }
  interface OneOfA_Star {
    A_Star: A_Star;
  }
  interface OneOfA_Indices {
    A_Indices: A_Indices;
  }
  interface OneOfA_Indirection {
    A_Indirection: A_Indirection;
  }
  interface OneOfA_ArrayExpr {
    A_ArrayExpr: A_ArrayExpr;
  }
  interface OneOfResTarget {
    ResTarget: ResTarget;
  }
  interface OneOfMultiAssignRef {
    MultiAssignRef: MultiAssignRef;
  }
  interface OneOfTypeCast {
    TypeCast: TypeCast;
  }
  interface OneOfCollateClause {
    CollateClause: CollateClause;
  }
  interface OneOfSortBy {
    SortBy: SortBy;
  }
  interface OneOfWindowDef {
    WindowDef: WindowDef;
  }
  interface OneOfRangeSubselect {
    RangeSubselect: RangeSubselect;
  }
  interface OneOfRangeFunction {
    RangeFunction: RangeFunction;
  }
  interface OneOfRangeTableSample {
    RangeTableSample: RangeTableSample;
  }
  interface OneOfRangeTableFunc {
    RangeTableFunc: RangeTableFunc;
  }
  interface OneOfRangeTableFuncCol {
    RangeTableFuncCol: RangeTableFuncCol;
  }
  interface OneOfTypeName {
    TypeName: TypeName;
  }
  interface OneOfColumnDef {
    ColumnDef: ColumnDef;
  }
  interface OneOfIndexElem {
    IndexElem: IndexElem;
  }
  interface OneOfConstraint {
    Constraint: Constraint;
  }
  interface OneOfDefElem<A> {
    DefElem: DefElem<A>;
  }
  interface OneOfRangeTblEntry {
    RangeTblEntry: RangeTblEntry;
  }
  interface OneOfRangeTblFunction {
    RangeTblFunction: RangeTblFunction;
  }
  interface OneOfTableSampleClause {
    TableSampleClause: TableSampleClause;
  }
  interface OneOfWithCheckOption {
    WithCheckOption: WithCheckOption;
  }
  interface OneOfSortGroupClause {
    SortGroupClause: SortGroupClause;
  }
  interface OneOfGroupingSet {
    GroupingSet: GroupingSet;
  }
  interface OneOfWindowClause {
    WindowClause: WindowClause;
  }
  interface OneOfObjectWithArgs {
    ObjectWithArgs: ObjectWithArgs;
  }
  interface OneOfAccessPriv {
    AccessPriv: AccessPriv;
  }
  interface OneOfCreateOpClassItem {
    CreateOpClassItem: CreateOpClassItem;
  }
  interface OneOfTableLikeClause {
    TableLikeClause: TableLikeClause;
  }
  interface OneOfFunctionParameter {
    FunctionParameter: FunctionParameter;
  }
  interface OneOfLockingClause {
    LockingClause: LockingClause;
  }
  interface OneOfRowMarkClause {
    RowMarkClause: RowMarkClause;
  }
  interface OneOfXmlSerialize {
    XmlSerialize: XmlSerialize;
  }
  interface OneOfWithClause {
    WithClause: WithClause;
  }
  interface OneOfInferClause {
    InferClause: InferClause;
  }
  interface OneOfOnConflictClause {
    OnConflictClause: OnConflictClause;
  }
  interface OneOfCommonTableExpr {
    CommonTableExpr: CommonTableExpr;
  }
  interface OneOfRoleSpec {
    RoleSpec: RoleSpec;
  }
  interface OneOfTriggerTransition {
    TriggerTransition: TriggerTransition;
  }
  interface OneOfPartitionElem {
    PartitionElem: PartitionElem;
  }
  interface OneOfPartitionSpec {
    PartitionSpec: PartitionSpec;
  }
  interface OneOfPartitionBoundSpec {
    PartitionBoundSpec: PartitionBoundSpec;
  }
  interface OneOfPartitionRangeDatum {
    PartitionRangeDatum: PartitionRangeDatum;
  }
  interface OneOfPartitionCmd {
    PartitionCmd: PartitionCmd;
  }
  interface OneOfVacuumRelation {
    VacuumRelation: VacuumRelation;
  }
  interface OneOfInlineCodeBlock {
    InlineCodeBlock: InlineCodeBlock;
  }
  interface OneOfCallContext {
    CallContext: CallContext;
  }
  interface OneOfInteger {
    Integer: PgInteger;
  }
  interface OneOfFloat {
    Float: PgFloat;
  }
  interface OneOfString {
    String: PgString;
  }
  interface OneOfBitString {
    BitString: PgBitString;
  }
  interface OneOfNull {
    Null: PgNull;
  }
  interface OneOfIntList {
    IntList: IntList;
  }
  interface OneOfOidList {
    OidList: OidList;
  }

  interface PgInteger {
    ival: number /* machine integer */;
  }

  interface PgFloat {
    str: string /* string */;
  }

  interface PgString {
    str: string /* string */;
  }

  interface PgBitString {
    str: string /* string */;
  }

  interface PgNull {
    // intentionally empty
  }

  interface EmptyObject {
    // intentionally empty
  }

  interface List<A> {
    items: Array<A>;
  }

  interface OneOfList<A> {
    List: List<A>;
  }

  interface OidList {
    items: Array<OneOfNull>;
  }

  interface IntList {
    items: Array<OneOfNull>;
  }

  interface Alias {
    aliasname: string;
    colnames?: Array<OneOfString>;
  }

  interface RangeVar {
    catalogname?: string;
    schemaname?: string;
    relname: string;
    inh?: boolean;
    relpersistence: string;
    alias?: Alias;
    location: number;
  }

  interface TableFunc {
    ns_uris: Array<OneOfNull>;
    ns_names?: Array<OneOfNull>;
    docexpr: OneOfNull;
    rowexpr: OneOfNull;
    colnames: Array<OneOfNull>;
    coltypes: Array<OneOfNull>;
    coltypmods: Array<OneOfNull>;
    colcollations: Array<OneOfNull>;
    colexprs: Array<OneOfNull>;
    coldefexprs: Array<OneOfNull>;
    notnulls: Array<number>;
    ordinalitycol: number;
    location: number;
  }

  interface Expr {
    // intentionally empty
  }

  interface Var {
    xpr: OneOfNull;
    varno: number;
    varattno: number;
    vartype: number;
    vartypmod: number;
    varcollid: number;
    varlevelsup: number;
    varnosyn: number;
    varattnosyn: number;
    location: number;
  }

  interface Param {
    xpr: OneOfNull;
    paramkind: ParamKind;
    paramid: number;
    paramtype: number;
    paramtypmod: number;
    paramcollid: number;
    location: number;
  }

  interface Aggref {
    xpr: OneOfNull;
    aggfnoid: number;
    aggtype: number;
    aggcollid: number;
    inputcollid: number;
    aggtranstype: number;
    aggargtypes: Array<OneOfNull>;
    aggdirectargs: Array<OneOfNull>;
    args: Array<OneOfNull>;
    aggorder: Array<OneOfNull>;
    aggdistinct: Array<OneOfNull>;
    aggfilter: OneOfNull;
    aggstar: boolean;
    aggvariadic: boolean;
    aggkind: string;
    agglevelsup: number;
    aggsplit: AggSplit;
    location: number;
  }

  interface GroupingFunc {
    xpr?: OneOfNull;
    args: Array<OneOfColumnRef | OneOfA_Expr>;
    refs?: Array<OneOfNull>;
    cols?: Array<OneOfNull>;
    agglevelsup?: number;
    location: number;
  }

  interface WindowFunc {
    xpr: OneOfNull;
    winfnoid: number;
    wintype: number;
    wincollid: number;
    inputcollid: number;
    args: Array<OneOfNull>;
    aggfilter: OneOfNull;
    winref: number;
    winstar: boolean;
    winagg: boolean;
    location: number;
  }

  interface SubscriptingRef {
    xpr: OneOfNull;
    refcontainertype: number;
    refelemtype: number;
    reftypmod: number;
    refcollid: number;
    refupperindexpr: Array<OneOfNull>;
    reflowerindexpr: Array<OneOfNull>;
    refexpr: OneOfNull;
    refassgnexpr?: OneOfNull;
  }

  interface FuncExpr {
    xpr: OneOfNull;
    funcid: number;
    funcresulttype: number;
    funcretset: boolean;
    funcvariadic: boolean;
    funcformat: CoercionForm;
    funccollid: number;
    inputcollid: number;
    args: Array<OneOfNull>;
    location: number;
  }

  interface NamedArgExpr {
    xpr?: OneOfNull;
    arg:
      | OneOfA_Const
      | OneOfTypeCast
      | OneOfColumnRef
      | OneOfA_Expr
      | OneOfFuncCall;
    name: string;
    argnumber: number;
    location: number;
  }

  interface OpExpr {
    xpr: OneOfNull;
    opno: number;
    opfuncid: number;
    opresulttype: number;
    opretset: boolean;
    opcollid: number;
    inputcollid: number;
    args: Array<OneOfNull>;
    location: number;
  }

  interface DistinctExpr {
    xpr: OneOfNull;
    opno: number;
    opfuncid: number;
    opresulttype: number;
    opretset: boolean;
    opcollid: number;
    inputcollid: number;
    args: Array<OneOfNull>;
    location: number;
  }

  interface NullIfExpr {
    xpr: OneOfNull;
    opno: number;
    opfuncid: number;
    opresulttype: number;
    opretset: boolean;
    opcollid: number;
    inputcollid: number;
    args: Array<OneOfNull>;
    location: number;
  }

  interface ScalarArrayOpExpr {
    xpr: OneOfNull;
    opno: number;
    opfuncid: number;
    useOr: boolean;
    inputcollid: number;
    args: Array<OneOfNull>;
    location: number;
  }

  interface BoolExpr {
    xpr?: OneOfNull;
    boolop: BoolExprType;
    args: Array<
      | OneOfA_Expr
      | OneOfCaseExpr
      | OneOfTypeCast
      | OneOfXmlExpr
      | OneOfSubLink
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfBooleanTest
      | OneOfBoolExpr
      | OneOfParamRef
      | OneOfNullTest
    >;
    location: number;
  }

  interface SubLink {
    xpr?: OneOfNull;
    subLinkType: SubLinkType;
    subLinkId?: number;
    testexpr?:
      | OneOfRowExpr
      | OneOfColumnRef
      | OneOfCaseExpr
      | OneOfTypeCast
      | OneOfA_Expr
      | OneOfA_Const;
    operName?: Array<OneOfString>;
    subselect: OneOfSelectStmt;
    location: number;
  }

  interface SubPlan {
    xpr: OneOfNull;
    subLinkType: SubLinkType;
    testexpr?: OneOfNull;
    paramIds: Array<OneOfNull>;
    plan_id: number;
    plan_name: string;
    firstColType: number;
    firstColTypmod: number;
    firstColCollation: number;
    useHashTable: boolean;
    unknownEqFalse: boolean;
    parallel_safe: boolean;
    setParam: Array<OneOfNull>;
    parParam: Array<OneOfNull>;
    args: Array<OneOfNull>;
    startup_cost: number;
    per_call_cost: number;
  }

  interface AlternativeSubPlan {
    xpr: OneOfNull;
    subplans: Array<OneOfNull>;
  }

  interface FieldSelect {
    xpr: OneOfNull;
    arg: OneOfNull;
    fieldnum: number;
    resulttype: number;
    resulttypmod: number;
    resultcollid: number;
  }

  interface FieldStore {
    xpr: OneOfNull;
    arg: OneOfNull;
    newvals: Array<OneOfNull>;
    fieldnums: Array<OneOfNull>;
    resulttype: number;
  }

  interface RelabelType {
    xpr: OneOfNull;
    arg: OneOfNull;
    resulttype: number;
    resulttypmod: number;
    resultcollid: number;
    relabelformat: CoercionForm;
    location: number;
  }

  interface CoerceViaIO {
    xpr: OneOfNull;
    arg: OneOfNull;
    resulttype: number;
    resultcollid: number;
    coerceformat: CoercionForm;
    location: number;
  }

  interface ArrayCoerceExpr {
    xpr: OneOfNull;
    arg: OneOfNull;
    elemexpr: OneOfNull;
    resulttype: number;
    resulttypmod: number;
    resultcollid: number;
    coerceformat: CoercionForm;
    location: number;
  }

  interface ConvertRowtypeExpr {
    xpr: OneOfNull;
    arg: OneOfNull;
    resulttype: number;
    convertformat: CoercionForm;
    location: number;
  }

  interface CollateExpr {
    xpr: OneOfNull;
    arg: OneOfNull;
    collOid: number;
    location: number;
  }

  interface CaseExpr {
    xpr?: OneOfNull;
    casetype?: number;
    casecollid?: number;
    arg?:
      | OneOfA_Expr
      | OneOfColumnRef
      | OneOfA_Const
      | OneOfTypeCast
      | OneOfA_Indirection
      | OneOfGroupingFunc
      | OneOfA_Indirection
      | OneOfFuncCall
      | OneOfCaseExpr;
    args: Array<OneOfCaseWhen | OneOfA_Expr>;
    defresult?:
      | OneOfA_Const
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfA_Indirection
      | OneOfA_Expr
      | OneOfParamRef
      | OneOfSubLink
      | OneOfMinMaxExpr
      | OneOfCaseExpr
      | OneOfA_ArrayExpr
      | OneOfTypeCast;
    location: number;
  }

  interface CaseWhen {
    xpr?: OneOfNull;
    expr:
      | OneOfA_Expr
      | OneOfA_Const
      | OneOfFuncCall
      | OneOfBoolExpr
      | OneOfTypeCast
      | OneOfSubLink
      | OneOfColumnRef
      | OneOfNullTest
      | OneOfBooleanTest;
    result:
      | OneOfA_Const
      | OneOfTypeCast
      | OneOfCoalesceExpr
      | OneOfA_ArrayExpr
      | OneOfMinMaxExpr
      | OneOfNullTest
      | OneOfA_Indirection
      | OneOfA_Expr
      | OneOfCaseExpr
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfSubLink;
    location: number;
  }

  interface CaseTestExpr {
    xpr: OneOfNull;
    typeId: number;
    typeMod: number;
    collation: number;
  }

  interface ArrayExpr {
    xpr: OneOfNull;
    array_typeid: number;
    array_collid: number;
    element_typeid: number;
    elements: Array<OneOfNull>;
    multidims: boolean;
    location: number;
  }

  interface RowExpr {
    xpr?: OneOfNull;
    args?: Array<
      | OneOfColumnRef
      | OneOfA_Const
      | OneOfRowExpr
      | OneOfCollateClause
      | OneOfParamRef
      | OneOfSetToDefault
      | OneOfA_ArrayExpr
      | OneOfSubLink
      | OneOfFuncCall
      | OneOfA_Expr
      | OneOfTypeCast
      | OneOfA_Indirection
    >;
    row_typeid?: number;
    row_format: CoercionForm;
    colnames?: Array<OneOfNull>;
    location: number;
  }

  interface RowCompareExpr {
    xpr: OneOfNull;
    rctype: RowCompareType;
    opnos: Array<OneOfNull>;
    opfamilies: Array<OneOfNull>;
    inputcollids: Array<OneOfNull>;
    largs: Array<OneOfNull>;
    rargs: Array<OneOfNull>;
  }

  interface CoalesceExpr {
    xpr?: OneOfNull;
    coalescetype?: number;
    coalescecollid?: number;
    args: Array<
      | OneOfColumnRef
      | OneOfA_Const
      | OneOfA_Indirection
      | OneOfCaseExpr
      | OneOfTypeCast
      | OneOfA_Expr
      | OneOfFuncCall
    >;
    location: number;
  }

  interface MinMaxExpr {
    xpr?: OneOfNull;
    minmaxtype?: number;
    minmaxcollid?: number;
    inputcollid?: number;
    op: MinMaxOp;
    args: Array<
      | OneOfA_Const
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfA_Expr
      | OneOfMinMaxExpr
      | OneOfTypeCast
    >;
    location: number;
  }

  interface SQLValueFunction {
    xpr?: OneOfNull;
    op: SQLValueFunctionOp;
    type?: number;
    typmod?: number;
    location: number;
  }

  interface XmlExpr {
    xpr?: OneOfNull;
    op: XmlExprOp;
    name?: string;
    named_args?: Array<OneOfResTarget>;
    arg_names?: Array<OneOfNull>;
    args?: Array<
      | OneOfFuncCall
      | OneOfXmlExpr
      | OneOfParamRef
      | OneOfColumnRef
      | OneOfA_Const
      | OneOfTypeCast
      | OneOfA_ArrayExpr
    >;
    xmloption: XmlOptionType;
    type?: number;
    typmod?: number;
    location: number;
  }

  interface NullTest {
    xpr?: OneOfNull;
    arg:
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfA_Indirection
      | OneOfA_Expr
      | OneOfTypeCast
      | OneOfRowExpr;
    nulltesttype: NullTestType;
    argisrow?: boolean;
    location: number;
  }

  interface BooleanTest {
    xpr?: OneOfNull;
    arg:
      | OneOfColumnRef
      | OneOfA_Expr
      | OneOfSubLink
      | OneOfFuncCall
      | OneOfTypeCast;
    booltesttype: BoolTestType;
    location: number;
  }

  interface CoerceToDomain {
    xpr: OneOfNull;
    arg: OneOfNull;
    resulttype: number;
    resulttypmod: number;
    resultcollid: number;
    coercionformat: CoercionForm;
    location: number;
  }

  interface CoerceToDomainValue {
    xpr: OneOfNull;
    typeId: number;
    typeMod: number;
    collation: number;
    location: number;
  }

  interface SetToDefault {
    xpr?: OneOfNull;
    typeId?: number;
    typeMod?: number;
    collation?: number;
    location: number;
  }

  interface CurrentOfExpr {
    xpr?: OneOfNull;
    cvarno?: number;
    cursor_name?: string;
    cursor_param?: number;
  }

  interface NextValueExpr {
    xpr: OneOfNull;
    seqid: number;
    typeId: number;
  }

  interface InferenceElem {
    xpr: OneOfNull;
    expr?: OneOfNull;
    infercollid: number;
    inferopclass: number;
  }

  interface TargetEntry {
    xpr: OneOfNull;
    expr: OneOfNull;
    resno: number;
    resname?: string;
    ressortgroupref: number;
    resorigtbl: number;
    resorigcol: number;
    resjunk: boolean;
  }

  interface RangeTblRef {
    rtindex: number;
  }

  interface JoinExpr {
    jointype: JoinType;
    isNatural?: boolean;
    larg:
      | OneOfRangeVar
      | OneOfJoinExpr
      | OneOfRangeSubselect
      | OneOfRangeFunction;
    rarg:
      | OneOfRangeVar
      | OneOfJoinExpr
      | OneOfRangeSubselect
      | OneOfRangeFunction;
    usingClause?: Array<OneOfString>;
    quals?: OneOfBoolExpr | OneOfA_Expr | OneOfTypeCast | OneOfFuncCall;
    alias?: Alias;
    rtindex?: number;
  }

  interface FromExpr {
    fromlist: Array<OneOfNull>;
    quals: OneOfNull;
  }

  interface OnConflictExpr {
    action: OnConflictAction;
    arbiterElems: Array<OneOfNull>;
    arbiterWhere: OneOfNull;
    constraint: number;
    onConflictSet: Array<OneOfNull>;
    onConflictWhere: OneOfNull;
    exclRelIndex: number;
    exclRelTlist: Array<OneOfNull>;
  }

  interface IntoClause {
    rel: RangeVar;
    colNames?: Array<OneOfString>;
    accessMethod?: string;
    options?: Array<OneOfDefElem<OneOfInteger>>;
    onCommit: OnCommitAction;
    tableSpaceName?: string;
    viewQuery?: OneOfNull;
    skipData?: boolean;
  }

  interface RawStmt {
    stmt:
      | OneOfSelectStmt
      | OneOfAlterTypeStmt
      | OneOfAlterTSConfigurationStmt
      | OneOfRefreshMatViewStmt
      | OneOfCreateExtensionStmt
      | OneOfAlterTSDictionaryStmt
      | OneOfAlterStatsStmt
      | OneOfCreateSubscriptionStmt
      | OneOfAlterSubscriptionStmt
      | OneOfAlterPublicationStmt
      | OneOfDropSubscriptionStmt
      | OneOfSecLabelStmt
      | OneOfAlterRoleSetStmt
      | OneOfCreateTransformStmt
      | OneOfCreatePublicationStmt
      | OneOfCheckPointStmt
      | OneOfImportForeignSchemaStmt
      | OneOfDiscardStmt
      | OneOfAlterDomainStmt
      | OneOfClosePortalStmt
      | OneOfConstraintsSetStmt
      | OneOfCreateUserMappingStmt
      | OneOfAlterUserMappingStmt
      | OneOfDropUserMappingStmt
      | OneOfAlterFdwStmt
      | OneOfGrantRoleStmt
      | OneOfAlterForeignServerStmt
      | OneOfAlterRoleStmt
      | OneOfAlterPolicyStmt
      | OneOfAlterEventTrigStmt
      | OneOfCreateEventTrigStmt
      | OneOfAlterEnumStmt
      | OneOfDropdbStmt
      | OneOfExecuteStmt
      | OneOfDropOwnedStmt
      | OneOfCopyStmt
      | OneOfAlterSeqStmt
      | OneOfTruncateStmt
      | OneOfVariableShowStmt
      | OneOfReassignOwnedStmt
      | OneOfAlterDefaultPrivilegesStmt
      | OneOfTransactionStmt
      | OneOfNotifyStmt
      | OneOfDeallocateStmt
      | OneOfReindexStmt
      | OneOfPrepareStmt
      | OneOfCreateSeqStmt
      | OneOfCreateAmStmt
      | OneOfCreateCastStmt
      | OneOfLockStmt
      | OneOfCallStmt
      | OneOfCreatePolicyStmt
      | OneOfFetchStmt
      | OneOfCreateForeignTableStmt
      | OneOfDeclareCursorStmt
      | OneOfListenStmt
      | OneOfUnlistenStmt
      | OneOfCreateRangeStmt
      | OneOfAlterCollationStmt
      | OneOfClusterStmt
      | OneOfRuleStmt
      | OneOfDropStmt
      | OneOfAlterFunctionStmt
      | OneOfCommentStmt
      | OneOfDoStmt
      | OneOfCreateEnumStmt
      | OneOfVariableSetStmt
      | OneOfCreateOpFamilyStmt
      | OneOfCreateTableAsStmt
      | OneOfCreateDomainStmt
      | OneOfExplainStmt
      | OneOfCreateFunctionStmt
      | OneOfDefineStmt
      | OneOfVacuumStmt
      | OneOfAlterTableStmt
      | OneOfViewStmt
      | OneOfCreateStmt
      | OneOfAlterOpFamilyStmt
      | OneOfCreateSchemaStmt
      | OneOfAlterOperatorStmt
      | OneOfCreateRoleStmt
      | OneOfDeleteStmt
      | OneOfGrantStmt
      | OneOfRenameStmt
      | OneOfUpdateStmt
      | OneOfCreateTrigStmt
      | OneOfIndexStmt
      | OneOfCreatePLangStmt
      | OneOfCreateOpClassStmt
      | OneOfCreateForeignServerStmt
      | OneOfCreateFdwStmt
      | OneOfCreateConversionStmt
      | OneOfAlterOwnerStmt
      | OneOfDropRoleStmt
      | OneOfInsertStmt
      | OneOfCreateStatsStmt
      | OneOfAlterObjectSchemaStmt
      | OneOfCompositeTypeStmt;
    stmt_location?: number;
    stmt_len?: number;
  }

  interface Query {
    commandType: CmdType;
    querySource: QuerySource;
    canSetTag: boolean;
    utilityStmt?: OneOfNull;
    resultRelation: number;
    hasAggs: boolean;
    hasWindowFuncs: boolean;
    hasTargetSRFs: boolean;
    hasSubLinks: boolean;
    hasDistinctOn: boolean;
    hasRecursive: boolean;
    hasModifyingCTE: boolean;
    hasForUpdate: boolean;
    hasRowSecurity: boolean;
    cteList: Array<OneOfNull>;
    rtable: Array<OneOfNull>;
    jointree: FromExpr;
    targetList: Array<OneOfNull>;
    override: OverridingKind;
    onConflict: OnConflictExpr;
    returningList: Array<OneOfNull>;
    groupClause: Array<OneOfNull>;
    groupingSets: Array<OneOfNull>;
    havingQual: OneOfNull;
    windowClause: Array<OneOfNull>;
    distinctClause: Array<OneOfNull>;
    sortClause: Array<OneOfNull>;
    limitOffset: OneOfNull;
    limitCount: OneOfNull;
    limitOption: LimitOption;
    rowMarks: Array<OneOfNull>;
    setOperations: OneOfNull;
    constraintDeps: Array<OneOfNull>;
    withCheckOptions: Array<OneOfNull>;
    stmt_location: number;
    stmt_len: number;
  }

  interface InsertStmt {
    relation: RangeVar;
    cols?: Array<OneOfResTarget>;
    selectStmt?: OneOfSelectStmt;
    onConflictClause?: OnConflictClause;
    returningList?: Array<OneOfResTarget>;
    withClause?: WithClause;
    override: OverridingKind;
  }

  interface DeleteStmt {
    relation: RangeVar;
    usingClause?: Array<OneOfRangeVar | OneOfJoinExpr | OneOfRangeSubselect>;
    whereClause?:
      | OneOfA_Expr
      | OneOfBoolExpr
      | OneOfSubLink
      | OneOfNullTest
      | OneOfFuncCall
      | OneOfCurrentOfExpr;
    returningList?: Array<OneOfResTarget>;
    withClause?: WithClause;
  }

  interface UpdateStmt {
    relation: RangeVar;
    targetList: Array<OneOfResTarget>;
    whereClause?:
      | OneOfA_Expr
      | OneOfNullTest
      | OneOfFuncCall
      | OneOfBoolExpr
      | OneOfTypeCast
      | OneOfCurrentOfExpr
      | OneOfSubLink;
    fromClause?: Array<
      OneOfRangeVar | OneOfRangeSubselect | OneOfRangeFunction | OneOfJoinExpr
    >;
    returningList?: Array<OneOfResTarget>;
    withClause?: WithClause;
  }

  interface SelectStmt {
    distinctClause?: Array<OneOfColumnRef | EmptyObject | OneOfA_Const>;
    intoClause?: IntoClause;
    targetList?: Array<OneOfResTarget>;
    fromClause?: Array<
      | OneOfRangeVar
      | OneOfRangeSubselect
      | OneOfRangeFunction
      | OneOfJoinExpr
      | OneOfRangeTableFunc
      | OneOfRangeTableSample
    >;
    whereClause?:
      | OneOfA_Expr
      | OneOfSubLink
      | OneOfBoolExpr
      | OneOfTypeCast
      | OneOfNullTest
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfBooleanTest;
    groupClause?: Array<
      | OneOfA_Expr
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfTypeCast
      | OneOfGroupingSet
      | OneOfRowExpr
      | OneOfA_Const
    >;
    havingClause?: OneOfA_Expr | OneOfSubLink | OneOfColumnRef | OneOfBoolExpr;
    windowClause?: Array<OneOfWindowDef>;
    valuesLists?: Array<
      OneOfList<
        | OneOfA_Const
        | OneOfTypeCast
        | OneOfCollateClause
        | OneOfSQLValueFunction
        | OneOfColumnRef
        | OneOfBoolExpr
        | OneOfA_ArrayExpr
        | OneOfFuncCall
        | OneOfA_Indirection
        | OneOfRowExpr
        | OneOfSubLink
        | OneOfParamRef
        | OneOfSetToDefault
        | OneOfA_Expr
      >
    >;
    sortClause?: Array<OneOfSortBy>;
    limitOffset?: OneOfA_Const | OneOfCaseExpr | OneOfA_Expr | OneOfColumnRef;
    limitCount?: OneOfA_Const | OneOfCaseExpr | OneOfA_Expr | OneOfFuncCall;
    limitOption: LimitOption;
    lockingClause?: Array<OneOfLockingClause>;
    withClause?: WithClause;
    op: SetOperation;
    all?: boolean;
    larg?: SelectStmt;
    rarg?: SelectStmt;
  }

  interface AlterTableStmt {
    relation: RangeVar;
    cmds: Array<OneOfAlterTableCmd>;
    relkind: ObjectType;
    missing_ok?: boolean;
  }

  interface AlterTableCmd {
    subtype: AlterTableType;
    name?: string;
    num?: number;
    newowner?: RoleSpec;
    def?:
      | OneOfList<
          OneOfDefElem<OneOfInteger | OneOfTypeName | OneOfString | OneOfFloat>
        >
      | OneOfPartitionCmd
      | OneOfRangeVar
      | OneOfA_Const
      | OneOfFuncCall
      | OneOfReplicaIdentityStmt
      | OneOfTypeName
      | OneOfA_Expr
      | OneOfTypeCast
      | OneOfString
      | OneOfInteger
      | OneOfColumnDef
      | OneOfConstraint;
    behavior: DropBehavior;
    missing_ok?: boolean;
    recurse?: boolean;
  }

  interface AlterDomainStmt {
    subtype: string;
    typeName: Array<OneOfString>;
    name?: string;
    def?: OneOfConstraint | OneOfA_Const;
    behavior: DropBehavior;
    missing_ok?: boolean;
  }

  interface SetOperationStmt {
    op: SetOperation;
    all: boolean;
    larg: OneOfNull;
    rarg: OneOfNull;
    colTypes: Array<OneOfNull>;
    colTypmods: Array<OneOfNull>;
    colCollations: Array<OneOfNull>;
    groupClauses: Array<OneOfNull>;
  }

  interface GrantStmt {
    is_grant?: boolean;
    targtype: GrantTargetType;
    objtype: ObjectType;
    objects?: Array<
      | OneOfString
      | OneOfRangeVar
      | OneOfList<OneOfString>
      | OneOfObjectWithArgs
      | OneOfInteger
    >;
    privileges?: Array<OneOfAccessPriv>;
    grantees: Array<OneOfRoleSpec>;
    grant_option?: boolean;
    behavior: DropBehavior;
  }

  interface GrantRoleStmt {
    granted_roles: Array<OneOfAccessPriv>;
    grantee_roles: Array<OneOfRoleSpec>;
    is_grant?: boolean;
    admin_opt?: boolean;
    grantor?: RoleSpec;
    behavior: DropBehavior;
  }

  interface AlterDefaultPrivilegesStmt {
    options?: Array<OneOfDefElem<OneOfList<OneOfString | OneOfRoleSpec>>>;
    action: GrantStmt;
  }

  interface ClosePortalStmt {
    portalname?: string;
  }

  interface ClusterStmt {
    relation?: RangeVar;
    indexname?: string;
    options?: number;
  }

  interface CopyStmt {
    relation?: RangeVar;
    query?:
      | OneOfInsertStmt
      | OneOfUpdateStmt
      | OneOfDeleteStmt
      | OneOfSelectStmt;
    attlist?: Array<OneOfString>;
    is_from?: boolean;
    is_program?: boolean;
    filename?: string;
    options?: Array<
      OneOfDefElem<
        OneOfString | OneOfInteger | OneOfA_Star | OneOfList<OneOfString>
      >
    >;
    whereClause?: OneOfA_Expr | OneOfSubLink;
  }

  interface CreateStmt {
    relation: RangeVar;
    tableElts?: Array<OneOfColumnDef | OneOfConstraint | OneOfTableLikeClause>;
    inhRelations?: Array<OneOfRangeVar>;
    partbound?: PartitionBoundSpec;
    partspec?: PartitionSpec;
    ofTypename?: TypeName;
    constraints?: Array<OneOfNull>;
    options?: Array<
      OneOfDefElem<OneOfInteger | OneOfTypeName | OneOfString | OneOfFloat>
    >;
    oncommit: OnCommitAction;
    tablespacename?: string;
    accessMethod?: string;
    if_not_exists?: boolean;
  }

  interface DefineStmt {
    kind: ObjectType;
    oldstyle?: boolean;
    defnames: Array<OneOfString>;
    args?: Array<
      OneOfInteger | OneOfList<OneOfFunctionParameter> | EmptyObject
    >;
    definition?: Array<
      OneOfDefElem<
        OneOfTypeName | OneOfString | OneOfInteger | OneOfList<OneOfString>
      >
    >;
    if_not_exists?: boolean;
    replace?: boolean;
  }

  interface DropStmt {
    objects: Array<
      | OneOfString
      | OneOfList<OneOfString | OneOfTypeName>
      | OneOfObjectWithArgs
      | OneOfTypeName
    >;
    removeType: ObjectType;
    behavior: DropBehavior;
    missing_ok?: boolean;
    concurrent?: boolean;
  }

  interface TruncateStmt {
    relations: Array<OneOfRangeVar>;
    restart_seqs?: boolean;
    behavior: DropBehavior;
  }

  interface CommentStmt {
    objtype: ObjectType;
    object:
      | OneOfList<OneOfString | OneOfTypeName>
      | OneOfString
      | OneOfObjectWithArgs
      | OneOfTypeName;
    comment?: string;
  }

  interface FetchStmt {
    direction: FetchDirection;
    howMany?: number;
    portalname: string;
    ismove?: boolean;
  }

  interface IndexStmt {
    idxname?: string;
    relation: RangeVar;
    accessMethod: string;
    tableSpace?: string;
    indexParams: Array<OneOfIndexElem>;
    indexIncludingParams?: Array<OneOfIndexElem>;
    options?: Array<OneOfDefElem<OneOfInteger | OneOfString | OneOfTypeName>>;
    whereClause?: OneOfNullTest | OneOfA_Expr | OneOfBoolExpr;
    excludeOpNames?: Array<OneOfNull>;
    idxcomment?: string;
    indexOid?: number;
    oldNode?: number;
    oldCreateSubid?: number;
    oldFirstRelfilenodeSubid?: number;
    unique?: boolean;
    primary?: boolean;
    isconstraint?: boolean;
    deferrable?: boolean;
    initdeferred?: boolean;
    transformed?: boolean;
    concurrent?: boolean;
    if_not_exists?: boolean;
    reset_default_tblspc?: boolean;
  }

  interface CreateFunctionStmt {
    is_procedure?: boolean;
    replace?: boolean;
    funcname: Array<OneOfString>;
    parameters?: Array<OneOfFunctionParameter>;
    returnType?: TypeName;
    options: Array<
      OneOfDefElem<
        | OneOfList<OneOfString>
        | OneOfString
        | OneOfFloat
        | OneOfInteger
        | OneOfVariableSetStmt
      >
    >;
  }

  interface AlterFunctionStmt {
    objtype: ObjectType;
    func: ObjectWithArgs;
    actions: Array<
      OneOfDefElem<
        | OneOfInteger
        | OneOfString
        | OneOfVariableSetStmt
        | OneOfList<OneOfString>
      >
    >;
  }

  interface DoStmt {
    args: Array<OneOfDefElem<OneOfString>>;
  }

  interface RenameStmt {
    renameType: ObjectType;
    relationType: ObjectType;
    relation?: RangeVar;
    object?: OneOfList<OneOfString> | OneOfObjectWithArgs | OneOfString;
    subname?: string;
    newname: string;
    behavior: DropBehavior;
    missing_ok?: boolean;
  }

  interface RuleStmt {
    relation: RangeVar;
    rulename: string;
    whereClause?: OneOfA_Expr | OneOfBoolExpr | OneOfSubLink;
    event: CmdType;
    instead?: boolean;
    actions?: Array<
      | OneOfInsertStmt
      | OneOfString
      | OneOfDeleteStmt
      | OneOfUpdateStmt
      | OneOfNotifyStmt
      | OneOfSelectStmt
    >;
    replace?: boolean;
  }

  interface NotifyStmt {
    conditionname: string;
    payload?: string;
  }

  interface ListenStmt {
    conditionname: string;
  }

  interface UnlistenStmt {
    conditionname?: string;
  }

  interface TransactionStmt {
    kind: TransactionStmtKind;
    options?: Array<OneOfDefElem<OneOfA_Const>>;
    savepoint_name?: string;
    gid?: string;
    chain?: boolean;
  }

  interface ViewStmt {
    view: RangeVar;
    aliases?: Array<OneOfString>;
    query: OneOfSelectStmt;
    replace?: boolean;
    options?: Array<OneOfDefElem<OneOfString | OneOfInteger>>;
    withCheckOption: ViewCheckOption;
  }

  interface LoadStmt {
    filename: string;
  }

  interface CreateDomainStmt {
    domainname: Array<OneOfString>;
    typeName: TypeName;
    collClause?: CollateClause;
    constraints?: Array<OneOfConstraint>;
  }

  interface CreatedbStmt {
    dbname: string;
    options: Array<OneOfNull>;
  }

  interface DropdbStmt {
    dbname: string;
    missing_ok?: boolean;
    options: Array<OneOfDefElem<never>>;
  }

  interface VacuumStmt {
    options?: Array<OneOfDefElem<OneOfInteger | OneOfString>>;
    rels?: Array<OneOfVacuumRelation>;
    is_vacuumcmd?: boolean;
  }

  interface ExplainStmt {
    query:
      | OneOfSelectStmt
      | OneOfUpdateStmt
      | OneOfDeleteStmt
      | OneOfExecuteStmt
      | OneOfDeclareCursorStmt
      | OneOfCreateTableAsStmt
      | OneOfInsertStmt;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface CreateTableAsStmt {
    query: OneOfSelectStmt | OneOfExecuteStmt;
    into: IntoClause;
    relkind: ObjectType;
    is_select_into?: boolean;
    if_not_exists?: boolean;
  }

  interface CreateSeqStmt {
    sequence: RangeVar;
    options?: Array<
      OneOfDefElem<OneOfInteger | OneOfTypeName | OneOfList<OneOfString>>
    >;
    ownerId?: number;
    for_identity?: boolean;
    if_not_exists?: boolean;
  }

  interface AlterSeqStmt {
    sequence: RangeVar;
    options: Array<
      OneOfDefElem<OneOfTypeName | OneOfInteger | OneOfList<OneOfString>>
    >;
    for_identity?: boolean;
    missing_ok?: boolean;
  }

  interface VariableSetStmt {
    kind: VariableSetKind;
    name?: string;
    args?: Array<OneOfA_Const | OneOfNull | OneOfDefElem<OneOfA_Const>>;
    is_local?: boolean;
  }

  interface VariableShowStmt {
    name: string;
  }

  interface DiscardStmt {
    target: DiscardMode;
  }

  interface CreateTrigStmt {
    trigname: string;
    relation: RangeVar;
    funcname: Array<OneOfString>;
    args?: Array<OneOfString>;
    row?: boolean;
    timing?: number;
    events: number;
    columns?: Array<OneOfString>;
    whenClause?: OneOfA_Expr | OneOfNullTest | OneOfTypeCast | OneOfBoolExpr;
    isconstraint?: boolean;
    transitionRels?: Array<OneOfTriggerTransition>;
    deferrable?: boolean;
    initdeferred?: boolean;
    constrrel?: RangeVar;
  }

  interface CreatePLangStmt {
    replace?: boolean;
    plname: string;
    plhandler: Array<OneOfString>;
    plinline?: Array<OneOfNull>;
    plvalidator?: Array<OneOfString>;
    pltrusted?: boolean;
  }

  interface CreateRoleStmt {
    stmt_type: RoleStmtType;
    role: string;
    options?: Array<
      OneOfDefElem<OneOfList<OneOfRoleSpec> | OneOfInteger | OneOfString>
    >;
  }

  interface AlterRoleStmt {
    role: RoleSpec;
    options: Array<
      OneOfDefElem<OneOfInteger | OneOfString | OneOfList<OneOfRoleSpec>>
    >;
    action: number;
  }

  interface DropRoleStmt {
    roles: Array<OneOfRoleSpec>;
    missing_ok?: boolean;
  }

  interface LockStmt {
    relations: Array<OneOfRangeVar>;
    mode: number;
    nowait?: boolean;
  }

  interface ConstraintsSetStmt {
    constraints?: Array<OneOfRangeVar>;
    deferred?: boolean;
  }

  interface ReindexStmt {
    kind: ReindexObjectType;
    relation?: RangeVar;
    name?: string;
    options?: number;
    concurrent?: boolean;
  }

  interface CheckPointStmt {}

  interface CreateSchemaStmt {
    schemaname: string;
    authrole?: RoleSpec;
    schemaElts?: Array<OneOfCreateStmt | OneOfViewStmt | OneOfIndexStmt>;
    if_not_exists?: boolean;
  }

  interface AlterDatabaseStmt {
    dbname: string;
    options: Array<OneOfNull>;
  }

  interface AlterDatabaseSetStmt {
    dbname: string;
    setstmt: VariableSetStmt;
  }

  interface AlterRoleSetStmt {
    role: RoleSpec;
    database?: string;
    setstmt: VariableSetStmt;
  }

  interface CreateConversionStmt {
    conversion_name: Array<OneOfString>;
    for_encoding_name: string;
    to_encoding_name: string;
    func_name: Array<OneOfString>;
    def?: boolean;
  }

  interface CreateCastStmt {
    sourcetype: TypeName;
    targettype: TypeName;
    func?: ObjectWithArgs;
    context: CoercionContext;
    inout?: boolean;
  }

  interface CreateOpClassStmt {
    opclassname: Array<OneOfString>;
    opfamilyname?: Array<OneOfNull>;
    amname: string;
    datatype: TypeName;
    items: Array<OneOfCreateOpClassItem>;
    isDefault?: boolean;
  }

  interface CreateOpFamilyStmt {
    opfamilyname: Array<OneOfString>;
    amname: string;
  }

  interface AlterOpFamilyStmt {
    opfamilyname: Array<OneOfString>;
    amname: string;
    isDrop?: boolean;
    items: Array<OneOfCreateOpClassItem>;
  }

  interface PrepareStmt {
    name: string;
    argtypes?: Array<OneOfTypeName>;
    query:
      | OneOfSelectStmt
      | OneOfExecuteStmt
      | OneOfInsertStmt
      | OneOfUpdateStmt;
  }

  interface ExecuteStmt {
    name: string;
    params?: Array<
      OneOfA_Const | OneOfTypeCast | OneOfFuncCall | OneOfA_ArrayExpr
    >;
  }

  interface DeallocateStmt {
    name?: string;
  }

  interface DeclareCursorStmt {
    portalname: string;
    options: number;
    query: OneOfSelectStmt;
  }

  interface CreateTableSpaceStmt {
    tablespacename: string;
    owner: RoleSpec;
    location: string;
    options: Array<OneOfNull>;
  }

  interface DropTableSpaceStmt {
    tablespacename: string;
    missing_ok: boolean;
  }

  interface AlterObjectDependsStmt {
    objectType: ObjectType;
    relation: RangeVar;
    object: OneOfNull;
    extname: OneOfNull;
    remove: boolean;
  }

  interface AlterObjectSchemaStmt {
    objectType: ObjectType;
    relation?: RangeVar;
    object?: OneOfList<OneOfString> | OneOfObjectWithArgs;
    newschema: string;
    missing_ok?: boolean;
  }

  interface AlterOwnerStmt {
    objectType: ObjectType;
    relation?: RangeVar;
    object: OneOfList<OneOfString> | OneOfObjectWithArgs | OneOfString;
    newowner: RoleSpec;
  }

  interface AlterOperatorStmt {
    opername: ObjectWithArgs;
    options: Array<OneOfDefElem<OneOfTypeName | OneOfList<OneOfString>>>;
  }

  interface AlterTypeStmt {
    typeName: Array<OneOfString | OneOfNull>;
    options: Array<OneOfDefElem<OneOfTypeName>>;
  }

  interface DropOwnedStmt {
    roles: Array<OneOfRoleSpec>;
    behavior: DropBehavior;
  }

  interface ReassignOwnedStmt {
    roles: Array<OneOfRoleSpec>;
    newrole: RoleSpec;
  }

  interface CompositeTypeStmt {
    typevar: RangeVar;
    coldeflist?: Array<OneOfColumnDef>;
  }

  interface CreateEnumStmt {
    typeName: Array<OneOfString>;
    vals: Array<OneOfString>;
  }

  interface CreateRangeStmt {
    typeName: Array<OneOfString>;
    params: Array<OneOfDefElem<OneOfTypeName>>;
  }

  interface AlterEnumStmt {
    typeName: Array<OneOfString>;
    oldVal?: string;
    newVal: string;
    newValNeighbor?: string;
    newValIsAfter?: boolean;
    skipIfNewValExists?: boolean;
  }

  interface AlterTSDictionaryStmt {
    dictname: Array<OneOfString>;
    options: Array<OneOfDefElem<OneOfInteger | OneOfTypeName>>;
  }

  interface AlterTSConfigurationStmt {
    kind: AlterTSConfigType;
    cfgname: Array<OneOfString>;
    tokentype?: Array<OneOfString>;
    dicts: Array<OneOfList<OneOfString>>;
    override?: boolean;
    replace?: boolean;
    missing_ok?: boolean;
  }

  interface CreateFdwStmt {
    fdwname: string;
    func_options?: Array<OneOfDefElem<OneOfList<OneOfString>>>;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface AlterFdwStmt {
    fdwname: string;
    func_options?: Array<OneOfDefElem<OneOfList<OneOfString>>>;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface CreateForeignServerStmt {
    servername: string;
    servertype?: string;
    version?: string;
    fdwname: string;
    if_not_exists?: boolean;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface AlterForeignServerStmt {
    servername: string;
    version?: string;
    options?: Array<OneOfDefElem<OneOfString>>;
    has_version?: boolean;
  }

  interface CreateUserMappingStmt {
    user: RoleSpec;
    servername: string;
    if_not_exists?: boolean;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface AlterUserMappingStmt {
    user: RoleSpec;
    servername: string;
    options: Array<OneOfDefElem<OneOfString>>;
  }

  interface DropUserMappingStmt {
    user: RoleSpec;
    servername: string;
    missing_ok?: boolean;
  }

  interface AlterTableSpaceOptionsStmt {
    tablespacename: string;
    options: Array<OneOfNull>;
    isReset: boolean;
  }

  interface AlterTableMoveAllStmt {
    orig_tablespacename: string;
    objtype: ObjectType;
    roles: Array<OneOfNull>;
    new_tablespacename: string;
    nowait: boolean;
  }

  interface SecLabelStmt {
    objtype: ObjectType;
    object: OneOfList<OneOfString> | OneOfString;
    provider?: string;
    label: string;
  }

  interface CreateForeignTableStmt {
    base: CreateStmt;
    servername: string;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface ImportForeignSchemaStmt {
    server_name: string;
    remote_schema: string;
    local_schema: string;
    list_type: ImportForeignSchemaType;
    table_list?: Array<OneOfRangeVar>;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface CreateExtensionStmt {
    extname: string;
    if_not_exists: boolean;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface AlterExtensionStmt {
    extname: string;
    options: Array<OneOfNull>;
  }

  interface AlterExtensionContentsStmt {
    extname: string;
    action: number;
    objtype: ObjectType;
    object: OneOfNull;
  }

  interface CreateEventTrigStmt {
    trigname: string;
    eventname: string;
    whenclause?: Array<OneOfDefElem<OneOfList<OneOfString>>>;
    funcname: Array<OneOfString>;
  }

  interface AlterEventTrigStmt {
    trigname: string;
    tgenabled: string;
  }

  interface RefreshMatViewStmt {
    concurrent?: boolean;
    skipData?: boolean;
    relation: RangeVar;
  }

  interface ReplicaIdentityStmt {
    identity_type: string;
    name?: string;
  }

  interface AlterSystemStmt {
    setstmt: VariableSetStmt;
  }

  interface CreatePolicyStmt {
    policy_name: string;
    table: RangeVar;
    cmd_name: string;
    permissive?: boolean;
    roles: Array<OneOfRoleSpec>;
    qual?:
      | OneOfA_Expr
      | OneOfTypeCast
      | OneOfFuncCall
      | OneOfBoolExpr
      | OneOfCaseWhen
      | OneOfSubLink
      | OneOfCaseExpr;
    with_check?: OneOfA_Expr | OneOfTypeCast | OneOfSubLink | OneOfBoolExpr;
  }

  interface AlterPolicyStmt {
    policy_name: string;
    table: RangeVar;
    roles?: Array<OneOfRoleSpec>;
    qual?: OneOfTypeCast | OneOfA_Expr | OneOfSubLink;
    with_check?: OneOfNull;
  }

  interface CreateTransformStmt {
    replace?: boolean;
    type_name: TypeName;
    lang: string;
    fromsql: ObjectWithArgs;
    tosql: ObjectWithArgs;
  }

  interface CreateAmStmt {
    amname: string;
    handler_name: Array<OneOfString>;
    amtype: string;
  }

  interface CreatePublicationStmt {
    pubname: string;
    options?: Array<OneOfDefElem<OneOfTypeName | OneOfString>>;
    tables?: Array<OneOfRangeVar>;
    for_all_tables?: boolean;
  }

  interface AlterPublicationStmt {
    pubname: string;
    options?: Array<OneOfDefElem<OneOfTypeName | OneOfString>>;
    tables?: Array<OneOfRangeVar>;
    for_all_tables?: boolean;
    tableAction: DefElemAction;
  }

  interface CreateSubscriptionStmt {
    subname: string;
    conninfo: string;
    publication: Array<OneOfString>;
    options?: Array<OneOfDefElem<OneOfString>>;
  }

  interface AlterSubscriptionStmt {
    kind: AlterSubscriptionType;
    subname: string;
    conninfo?: string;
    publication?: Array<OneOfString>;
    options?: Array<OneOfDefElem<OneOfInteger | OneOfString | OneOfTypeName>>;
  }

  interface DropSubscriptionStmt {
    subname: string;
    missing_ok?: boolean;
    behavior: DropBehavior;
  }

  interface CreateStatsStmt {
    defnames: Array<OneOfString>;
    stat_types?: Array<OneOfString>;
    exprs: Array<OneOfColumnRef | OneOfA_Expr | OneOfRowExpr>;
    relations: Array<OneOfRangeVar>;
    stxcomment?: string;
    if_not_exists?: boolean;
  }

  interface AlterCollationStmt {
    collname: Array<OneOfString>;
  }

  interface CallStmt {
    funccall: FuncCall;
    funcexpr?: FuncExpr;
  }

  interface AlterStatsStmt {
    defnames: Array<OneOfString>;
    stxstattarget?: number;
    missing_ok?: boolean;
  }

  interface A_Expr {
    kind: A_Expr_Kind;
    name: Array<OneOfString>;
    lexpr?:
      | OneOfA_Expr
      | OneOfArrayExpr
      | OneOfA_ArrayExpr
      | OneOfList<
          | OneOfA_Const
          | OneOfTypeCast
          | OneOfA_Expr
          | OneOfTypeName
          | OneOfParamRef
          | OneOfRowExpr
          | OneOfSubLink
          | OneOfFuncCall
        >
      | OneOfA_Const
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfNullTest
      | OneOfCoalesceExpr
      | OneOfSubLink
      | OneOfSQLValueFunction
      | OneOfRowExpr
      | OneOfCaseExpr
      | OneOfParamRef
      | OneOfGroupingFunc
      | OneOfCollateClause
      | OneOfBoolExpr
      | OneOfMinMaxExpr
      | OneOfA_Indirection
      | OneOfTypeCast;
    rexpr?:
      | OneOfA_Expr
      | OneOfArrayExpr
      | OneOfA_ArrayExpr
      | OneOfList<
          | OneOfA_Const
          | OneOfTypeCast
          | OneOfA_Expr
          | OneOfTypeName
          | OneOfParamRef
          | OneOfRowExpr
          | OneOfSubLink
          | OneOfFuncCall
        >
      | OneOfA_Const
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfNullTest
      | OneOfParamRef
      | OneOfCoalesceExpr
      | OneOfSQLValueFunction
      | OneOfSubLink
      | OneOfRowExpr
      | OneOfCaseExpr
      | OneOfGroupingFunc
      | OneOfCollateClause
      | OneOfBoolExpr
      | OneOfMinMaxExpr
      | OneOfA_Indirection
      | OneOfTypeCast;
    location: number;
  }

  interface ColumnRef {
    fields: Array<OneOfString | OneOfA_Star>;
    location: number;
  }

  interface ParamRef {
    number: number;
    location: number;
  }

  interface A_Const {
    val: OneOfString | OneOfInteger | OneOfNull | OneOfFloat | OneOfBitString;
    location: number;
  }

  interface FuncCall {
    funcname: Array<OneOfString>;
    args?: Array<
      | OneOfA_Const
      | OneOfTypeCast
      | OneOfA_Indirection
      | OneOfCaseExpr
      | OneOfXmlExpr
      | OneOfColumnRef
      | OneOfMinMaxExpr
      | OneOfParamRef
      | OneOfCoalesceExpr
      | OneOfA_ArrayExpr
      | OneOfNamedArgExpr
      | OneOfSQLValueFunction
      | OneOfSubLink
      | OneOfNullTest
      | OneOfRowExpr
      | OneOfA_Expr
      | OneOfBoolExpr
      | OneOfFuncCall
      | OneOfCollateClause
    >;
    agg_order?: Array<OneOfSortBy>;
    agg_filter?:
      | OneOfA_Expr
      | OneOfFuncCall
      | OneOfSubLink
      | OneOfTypeCast
      | OneOfNullTest
      | OneOfBoolExpr
      | OneOfColumnRef
      | OneOfCollateClause;
    agg_within_group?: boolean;
    agg_star?: boolean;
    agg_distinct?: boolean;
    func_variadic?: boolean;
    over?: WindowDef;
    location: number;
  }

  interface A_Star {
    // intentionally empty
  }

  interface A_Indices {
    is_slice?: boolean;
    lidx?: OneOfA_Const;
    uidx?: OneOfA_Const | OneOfColumnRef | OneOfA_Expr;
  }

  interface A_Indirection {
    arg:
      | OneOfColumnRef
      | OneOfTypeCast
      | OneOfFuncCall
      | OneOfA_Indirection
      | OneOfA_ArrayExpr
      | OneOfSubLink
      | OneOfRowExpr;
    indirection: Array<OneOfString | OneOfA_Indices | OneOfA_Star>;
  }

  interface A_ArrayExpr {
    elements?: Array<
      | OneOfA_Const
      | OneOfColumnRef
      | OneOfA_ArrayExpr
      | OneOfCaseExpr
      | OneOfSQLValueFunction
      | OneOfFuncCall
      | OneOfRowExpr
      | OneOfA_Expr
      | OneOfTypeCast
    >;
    location: number;
  }

  interface ResTarget {
    name?: string;
    indirection?: Array<OneOfString | OneOfA_Indices>;
    val?:
      | OneOfFuncCall
      | OneOfColumnRef
      | OneOfTypeCast
      | OneOfRowExpr
      | OneOfMinMaxExpr
      | OneOfXmlSerialize
      | OneOfXmlExpr
      | OneOfSQLValueFunction
      | OneOfA_Expr
      | OneOfSetToDefault
      | OneOfMultiAssignRef
      | OneOfParamRef
      | OneOfA_ArrayExpr
      | OneOfCollateClause
      | OneOfCoalesceExpr
      | OneOfGroupingFunc
      | OneOfBooleanTest
      | OneOfBoolExpr
      | OneOfA_Indirection
      | OneOfA_Const
      | OneOfCaseExpr
      | OneOfNullTest
      | OneOfSubLink;
    location: number;
  }

  interface MultiAssignRef {
    source: OneOfRowExpr | OneOfSubLink | OneOfColumnRef;
    colno: number;
    ncolumns: number;
  }

  interface TypeCast {
    arg:
      | OneOfA_Expr
      | OneOfColumnRef
      | OneOfMinMaxExpr
      | OneOfA_Const
      | OneOfRowExpr
      | OneOfCoalesceExpr
      | OneOfCollateClause
      | OneOfCaseExpr
      | OneOfA_Indirection
      | OneOfSubLink
      | OneOfParamRef
      | OneOfSQLValueFunction
      | OneOfA_ArrayExpr
      | OneOfFuncCall
      | OneOfTypeCast;
    typeName: TypeName;
    location: number;
  }

  interface CollateClause {
    arg?:
      | OneOfColumnRef
      | OneOfTypeCast
      | OneOfA_Const
      | OneOfA_ArrayExpr
      | OneOfCaseExpr
      | OneOfA_Expr;
    collname: Array<OneOfString>;
    location: number;
  }

  interface SortBy {
    node:
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfA_Const
      | OneOfA_Indirection
      | OneOfCoalesceExpr
      | OneOfCollateClause
      | OneOfTypeCast
      | OneOfA_Expr;
    sortby_dir: SortByDir;
    sortby_nulls: SortByNulls;
    useOp?: Array<OneOfString>;
    location: number;
  }

  interface WindowDef {
    name?: string;
    refname?: string;
    partitionClause?: Array<OneOfColumnRef | OneOfFuncCall | OneOfA_Expr>;
    orderClause?: Array<OneOfSortBy>;
    frameOptions: number;
    startOffset?: OneOfA_Const | OneOfA_Expr | OneOfTypeCast;
    endOffset?: OneOfA_Const | OneOfTypeCast;
    location: number;
  }

  interface RangeSubselect {
    lateral?: boolean;
    subquery: OneOfSelectStmt;
    alias: Alias;
  }

  interface RangeFunction {
    lateral?: boolean;
    ordinality?: boolean;
    is_rowsfrom?: boolean;
    functions: Array<
      OneOfList<
        | OneOfFuncCall
        | OneOfCoalesceExpr
        | OneOfSQLValueFunction
        | OneOfList<OneOfColumnDef>
        | OneOfTypeCast
        | EmptyObject
      >
    >;
    alias?: Alias;
    coldeflist?: Array<OneOfColumnDef>;
  }

  interface RangeTableSample {
    relation: OneOfRangeVar;
    method: Array<OneOfString>;
    args: Array<OneOfA_Const | OneOfA_Expr | OneOfTypeCast | OneOfColumnRef>;
    repeatable?: OneOfA_Const | OneOfA_Expr;
    location: number;
  }

  interface RangeTableFunc {
    lateral?: boolean;
    docexpr: OneOfColumnRef | OneOfA_Const | OneOfXmlExpr;
    rowexpr: OneOfColumnRef | OneOfA_Const | OneOfRowExpr | OneOfA_Expr;
    namespaces?: Array<OneOfResTarget>;
    columns: Array<OneOfRangeTableFuncCol>;
    alias?: Alias;
    location: number;
  }

  interface RangeTableFuncCol {
    colname: string;
    typeName?: TypeName;
    for_ordinality?: boolean;
    is_not_null?: boolean;
    colexpr?: OneOfA_Const | OneOfA_Expr;
    coldefexpr?: OneOfA_Const | OneOfA_Expr;
    location: number;
  }

  interface TypeName {
    names: Array<OneOfString>;
    typeOid?: number;
    setof?: boolean;
    pct_type?: boolean;
    typmods?: Array<OneOfColumnRef | OneOfA_Const>;
    typemod: number;
    arrayBounds?: Array<OneOfInteger>;
    location: number;
  }

  interface ColumnDef {
    colname?: string;
    typeName?: TypeName;
    inhcount?: number;
    is_local?: boolean;
    is_not_null?: boolean;
    is_from_type?: boolean;
    storage?: string;
    raw_default?:
      | OneOfTypeCast
      | OneOfFuncCall
      | OneOfA_Expr
      | OneOfCaseExpr
      | OneOfA_Const;
    cooked_default?: OneOfNull;
    identity?: string;
    identitySequence?: RangeVar;
    generated?: string;
    collClause?: CollateClause;
    collOid?: number;
    constraints?: Array<OneOfConstraint>;
    fdwoptions?: Array<OneOfDefElem<OneOfString>>;
    location: number;
  }

  interface IndexElem {
    name?: string;
    expr?:
      | OneOfA_Expr
      | OneOfFuncCall
      | OneOfCollateClause
      | OneOfA_Const
      | OneOfRowExpr
      | OneOfCoalesceExpr;
    indexcolname?: string;
    collation?: Array<OneOfString>;
    opclass?: Array<OneOfString>;
    opclassopts?: Array<OneOfDefElem<OneOfInteger | OneOfString>>;
    ordering: SortByDir;
    nulls_ordering: SortByNulls;
  }

  interface Constraint {
    contype: ConstrType;
    conname?: string;
    deferrable?: boolean;
    initdeferred?: boolean;
    location?: number;
    is_no_inherit?: boolean;
    raw_expr?:
      | OneOfA_Const
      | OneOfA_Expr
      | OneOfBoolExpr
      | OneOfCaseExpr
      | OneOfTypeCast
      | OneOfMinMaxExpr
      | OneOfSQLValueFunction
      | OneOfColumnRef
      | OneOfRowExpr
      | OneOfSubLink
      | OneOfNullTest
      | OneOfFuncCall;
    cooked_expr?: string;
    generated_when?: string;
    keys?: Array<OneOfString>;
    including?: Array<OneOfString>;
    exclusions?: Array<OneOfList<OneOfIndexElem | OneOfList<OneOfString>>>;
    options?: Array<OneOfDefElem<OneOfInteger>>;
    indexname?: string;
    indexspace?: string;
    reset_default_tblspc?: boolean;
    access_method?: string;
    where_clause?: OneOfA_Expr | OneOfNullTest;
    pktable?: RangeVar;
    fk_attrs?: Array<OneOfString>;
    pk_attrs?: Array<OneOfString>;
    fk_matchtype?: string;
    fk_upd_action?: string;
    fk_del_action?: string;
    old_conpfeqop?: Array<OneOfNull>;
    old_pktable_oid?: number;
    skip_validation?: boolean;
    initially_valid?: boolean;
  }

  interface DefElem<A> {
    defnamespace?: string;
    defname: string;
    arg?: A;
    defaction: DefElemAction;
    location: number;
  }

  interface RangeTblEntry {
    rtekind: RTEKind;
    relid: number;
    relkind: string;
    rellockmode: number;
    tablesample: TableSampleClause;
    subquery: Query;
    security_barrier: boolean;
    jointype: JoinType;
    joinmergedcols: number;
    joinaliasvars: Array<OneOfNull>;
    joinleftcols: Array<OneOfNull>;
    joinrightcols: Array<OneOfNull>;
    functions: Array<OneOfNull>;
    funcordinality: boolean;
    tablefunc: TableFunc;
    values_lists: Array<OneOfNull>;
    ctename: string;
    ctelevelsup: number;
    self_reference: boolean;
    coltypes: Array<OneOfNull>;
    coltypmods: Array<OneOfNull>;
    colcollations: Array<OneOfNull>;
    enrname: string;
    enrtuples: number;
    alias: Alias;
    eref: Alias;
    lateral: boolean;
    inh: boolean;
    inFromCl: boolean;
    requiredPerms: number;
    checkAsUser: number;
    selectedCols: Array<number>;
    insertedCols: Array<number>;
    updatedCols: Array<number>;
    extraUpdatedCols: Array<number>;
    securityQuals: Array<OneOfNull>;
  }

  interface RangeTblFunction {
    funcexpr: OneOfNull;
    funccolcount: number;
    funccolnames: Array<OneOfNull>;
    funccoltypes: Array<OneOfNull>;
    funccoltypmods: Array<OneOfNull>;
    funccolcollations: Array<OneOfNull>;
    funcparams: Array<number>;
  }

  interface TableSampleClause {
    tsmhandler: number;
    args: Array<OneOfNull>;
    repeatable: OneOfNull;
  }

  interface WithCheckOption {
    kind: WCOKind;
    relname: string;
    polname: string;
    qual: OneOfNull;
    cascaded: boolean;
  }

  interface SortGroupClause {
    tleSortGroupRef: number;
    eqop: number;
    sortop: number;
    nulls_first: boolean;
    hashable: boolean;
  }

  interface GroupingSet {
    kind: GroupingSetKind;
    content?: Array<
      | OneOfColumnRef
      | OneOfGroupingSet
      | OneOfRowExpr
      | OneOfA_Expr
      | OneOfTypeCast
      | OneOfA_Const
    >;
    location: number;
  }

  interface WindowClause {
    name: string;
    refname: string;
    partitionClause: Array<OneOfNull>;
    orderClause: Array<OneOfNull>;
    frameOptions: number;
    startOffset: OneOfNull;
    endOffset: OneOfNull;
    startInRangeFunc: number;
    endInRangeFunc: number;
    inRangeColl: number;
    inRangeAsc: boolean;
    inRangeNullsFirst: boolean;
    winref: number;
    copiedOrder: boolean;
  }

  interface ObjectWithArgs {
    objname: Array<OneOfString>;
    objargs?: Array<OneOfTypeName | EmptyObject>;
    args_unspecified?: boolean;
  }

  interface AccessPriv {
    priv_name?: string;
    cols?: Array<OneOfString>;
  }

  interface CreateOpClassItem {
    itemtype: number;
    name?: ObjectWithArgs;
    number?: number;
    order_family?: Array<OneOfString>;
    class_args?: Array<OneOfTypeName>;
    storedtype?: TypeName;
  }

  interface TableLikeClause {
    relation: RangeVar;
    options?: number;
    relationOid?: number;
  }

  interface FunctionParameter {
    name?: string;
    argType: TypeName;
    mode: FunctionParameterMode;
    defexpr?: OneOfA_Const | OneOfTypeCast | OneOfSQLValueFunction;
  }

  interface LockingClause {
    lockedRels?: Array<OneOfRangeVar>;
    strength: LockClauseStrength;
    waitPolicy: LockWaitPolicy;
  }

  interface RowMarkClause {
    rti: number;
    strength: LockClauseStrength;
    waitPolicy: LockWaitPolicy;
    pushedDown: boolean;
  }

  interface XmlSerialize {
    xmloption: XmlOptionType;
    expr: OneOfColumnRef | OneOfA_Const;
    typeName: TypeName;
    location: number;
  }

  interface WithClause {
    ctes: Array<OneOfCommonTableExpr>;
    recursive?: boolean;
    location?: number;
  }

  interface InferClause {
    indexElems?: Array<OneOfIndexElem>;
    whereClause?: OneOfA_Expr | OneOfBoolExpr | OneOfNullTest;
    conname?: string;
    location: number;
  }

  interface OnConflictClause {
    action: OnConflictAction;
    infer?: InferClause;
    targetList?: Array<OneOfResTarget>;
    whereClause?: OneOfSubLink | OneOfA_Expr | OneOfNullTest | OneOfBoolExpr;
    location: number;
  }

  interface CommonTableExpr {
    ctename: string;
    aliascolnames?: Array<OneOfString>;
    ctematerialized: CTEMaterialize;
    ctequery?:
      | OneOfSelectStmt
      | OneOfInsertStmt
      | OneOfUpdateStmt
      | OneOfDeleteStmt;
    location: number;
    cterecursive?: boolean;
    cterefcount?: number;
    ctecolnames?: Array<OneOfNull>;
    ctecoltypes?: Array<OneOfNull>;
    ctecoltypmods?: Array<OneOfNull>;
    ctecolcollations?: Array<OneOfNull>;
  }

  interface RoleSpec {
    roletype: RoleSpecType;
    rolename?: string;
    location: number;
  }

  interface TriggerTransition {
    name: string;
    isNew?: boolean;
    isTable: boolean;
  }

  interface PartitionElem {
    name?: string;
    expr?:
      | OneOfA_Expr
      | OneOfFuncCall
      | OneOfA_Const
      | OneOfRowExpr
      | OneOfTypeCast
      | OneOfColumnRef;
    collation?: Array<OneOfString>;
    opclass?: Array<OneOfString>;
    location: number;
  }

  interface PartitionSpec {
    strategy: string;
    partParams: Array<OneOfPartitionElem>;
    location: number;
  }

  interface PartitionBoundSpec {
    strategy?: string;
    is_default?: boolean;
    modulus?: number;
    remainder?: number;
    listdatums?: Array<
      | OneOfA_Const
      | OneOfTypeCast
      | OneOfA_Expr
      | OneOfColumnRef
      | OneOfFuncCall
      | OneOfSubLink
      | OneOfCollateClause
    >;
    lowerdatums?: Array<
      | OneOfA_Const
      | OneOfColumnRef
      | OneOfSQLValueFunction
      | OneOfFuncCall
      | OneOfSubLink
      | OneOfCollateClause
      | OneOfTypeCast
    >;
    upperdatums?: Array<
      | OneOfA_Const
      | OneOfColumnRef
      | OneOfSQLValueFunction
      | OneOfFuncCall
      | OneOfSubLink
      | OneOfCollateClause
      | OneOfTypeCast
    >;
    location: number;
  }

  interface PartitionRangeDatum {
    kind: PartitionRangeDatumKind;
    value: OneOfNull;
    location: number;
  }

  interface PartitionCmd {
    name: RangeVar;
    bound?: PartitionBoundSpec;
  }

  interface VacuumRelation {
    relation: RangeVar;
    oid?: number;
    va_cols?: Array<OneOfString>;
  }

  interface InlineCodeBlock {
    source_text: string;
    langOid: number;
    langIsTrusted: boolean;
    atomic: boolean;
  }

  interface CallContext {
    atomic: boolean;
  }

  enum OverridingKind {
    OVERRIDING_KIND_UNDEFINED = 'OVERRIDING_KIND_UNDEFINED',
    OVERRIDING_NOT_SET = 'OVERRIDING_NOT_SET',
    OVERRIDING_USER_VALUE = 'OVERRIDING_USER_VALUE',
    OVERRIDING_SYSTEM_VALUE = 'OVERRIDING_SYSTEM_VALUE',
  }

  enum QuerySource {
    QUERY_SOURCE_UNDEFINED = 'QUERY_SOURCE_UNDEFINED',
    QSRC_ORIGINAL = 'QSRC_ORIGINAL',
    QSRC_PARSER = 'QSRC_PARSER',
    QSRC_INSTEAD_RULE = 'QSRC_INSTEAD_RULE',
    QSRC_QUAL_INSTEAD_RULE = 'QSRC_QUAL_INSTEAD_RULE',
    QSRC_NON_INSTEAD_RULE = 'QSRC_NON_INSTEAD_RULE',
  }

  enum SortByDir {
    SORT_BY_DIR_UNDEFINED = 'SORT_BY_DIR_UNDEFINED',
    SORTBY_DEFAULT = 'SORTBY_DEFAULT',
    SORTBY_ASC = 'SORTBY_ASC',
    SORTBY_DESC = 'SORTBY_DESC',
    SORTBY_USING = 'SORTBY_USING',
  }

  enum SortByNulls {
    SORT_BY_NULLS_UNDEFINED = 'SORT_BY_NULLS_UNDEFINED',
    SORTBY_NULLS_DEFAULT = 'SORTBY_NULLS_DEFAULT',
    SORTBY_NULLS_FIRST = 'SORTBY_NULLS_FIRST',
    SORTBY_NULLS_LAST = 'SORTBY_NULLS_LAST',
  }

  enum A_Expr_Kind {
    A_EXPR_KIND_UNDEFINED = 'A_EXPR_KIND_UNDEFINED',
    AEXPR_OP = 'AEXPR_OP',
    AEXPR_OP_ANY = 'AEXPR_OP_ANY',
    AEXPR_OP_ALL = 'AEXPR_OP_ALL',
    AEXPR_DISTINCT = 'AEXPR_DISTINCT',
    AEXPR_NOT_DISTINCT = 'AEXPR_NOT_DISTINCT',
    AEXPR_NULLIF = 'AEXPR_NULLIF',
    AEXPR_OF = 'AEXPR_OF',
    AEXPR_IN = 'AEXPR_IN',
    AEXPR_LIKE = 'AEXPR_LIKE',
    AEXPR_ILIKE = 'AEXPR_ILIKE',
    AEXPR_SIMILAR = 'AEXPR_SIMILAR',
    AEXPR_BETWEEN = 'AEXPR_BETWEEN',
    AEXPR_NOT_BETWEEN = 'AEXPR_NOT_BETWEEN',
    AEXPR_BETWEEN_SYM = 'AEXPR_BETWEEN_SYM',
    AEXPR_NOT_BETWEEN_SYM = 'AEXPR_NOT_BETWEEN_SYM',
    AEXPR_PAREN = 'AEXPR_PAREN',
  }

  enum RoleSpecType {
    ROLE_SPEC_TYPE_UNDEFINED = 'ROLE_SPEC_TYPE_UNDEFINED',
    ROLESPEC_CSTRING = 'ROLESPEC_CSTRING',
    ROLESPEC_CURRENT_USER = 'ROLESPEC_CURRENT_USER',
    ROLESPEC_SESSION_USER = 'ROLESPEC_SESSION_USER',
    ROLESPEC_PUBLIC = 'ROLESPEC_PUBLIC',
  }

  enum TableLikeOption {
    TABLE_LIKE_OPTION_UNDEFINED = 'TABLE_LIKE_OPTION_UNDEFINED',
    CREATE_TABLE_LIKE_COMMENTS = 'CREATE_TABLE_LIKE_COMMENTS',
    CREATE_TABLE_LIKE_CONSTRAINTS = 'CREATE_TABLE_LIKE_CONSTRAINTS',
    CREATE_TABLE_LIKE_DEFAULTS = 'CREATE_TABLE_LIKE_DEFAULTS',
    CREATE_TABLE_LIKE_GENERATED = 'CREATE_TABLE_LIKE_GENERATED',
    CREATE_TABLE_LIKE_IDENTITY = 'CREATE_TABLE_LIKE_IDENTITY',
    CREATE_TABLE_LIKE_INDEXES = 'CREATE_TABLE_LIKE_INDEXES',
    CREATE_TABLE_LIKE_STATISTICS = 'CREATE_TABLE_LIKE_STATISTICS',
    CREATE_TABLE_LIKE_STORAGE = 'CREATE_TABLE_LIKE_STORAGE',
    CREATE_TABLE_LIKE_ALL = 'CREATE_TABLE_LIKE_ALL',
  }

  enum DefElemAction {
    DEF_ELEM_ACTION_UNDEFINED = 'DEF_ELEM_ACTION_UNDEFINED',
    DEFELEM_UNSPEC = 'DEFELEM_UNSPEC',
    DEFELEM_SET = 'DEFELEM_SET',
    DEFELEM_ADD = 'DEFELEM_ADD',
    DEFELEM_DROP = 'DEFELEM_DROP',
  }

  enum PartitionRangeDatumKind {
    PARTITION_RANGE_DATUM_KIND_UNDEFINED = 'PARTITION_RANGE_DATUM_KIND_UNDEFINED',
    PARTITION_RANGE_DATUM_MINVALUE = 'PARTITION_RANGE_DATUM_MINVALUE',
    PARTITION_RANGE_DATUM_VALUE = 'PARTITION_RANGE_DATUM_VALUE',
    PARTITION_RANGE_DATUM_MAXVALUE = 'PARTITION_RANGE_DATUM_MAXVALUE',
  }

  enum RTEKind {
    RTEKIND_UNDEFINED = 'RTEKIND_UNDEFINED',
    RTE_RELATION = 'RTE_RELATION',
    RTE_SUBQUERY = 'RTE_SUBQUERY',
    RTE_JOIN = 'RTE_JOIN',
    RTE_FUNCTION = 'RTE_FUNCTION',
    RTE_TABLEFUNC = 'RTE_TABLEFUNC',
    RTE_VALUES = 'RTE_VALUES',
    RTE_CTE = 'RTE_CTE',
    RTE_NAMEDTUPLESTORE = 'RTE_NAMEDTUPLESTORE',
    RTE_RESULT = 'RTE_RESULT',
  }

  enum WCOKind {
    WCOKIND_UNDEFINED = 'WCOKIND_UNDEFINED',
    WCO_VIEW_CHECK = 'WCO_VIEW_CHECK',
    WCO_RLS_INSERT_CHECK = 'WCO_RLS_INSERT_CHECK',
    WCO_RLS_UPDATE_CHECK = 'WCO_RLS_UPDATE_CHECK',
    WCO_RLS_CONFLICT_CHECK = 'WCO_RLS_CONFLICT_CHECK',
  }

  enum GroupingSetKind {
    GROUPING_SET_KIND_UNDEFINED = 'GROUPING_SET_KIND_UNDEFINED',
    GROUPING_SET_EMPTY = 'GROUPING_SET_EMPTY',
    GROUPING_SET_SIMPLE = 'GROUPING_SET_SIMPLE',
    GROUPING_SET_ROLLUP = 'GROUPING_SET_ROLLUP',
    GROUPING_SET_CUBE = 'GROUPING_SET_CUBE',
    GROUPING_SET_SETS = 'GROUPING_SET_SETS',
  }

  enum CTEMaterialize {
    CTEMATERIALIZE_UNDEFINED = 'CTEMATERIALIZE_UNDEFINED',
    CTEMaterializeDefault = 'CTEMaterializeDefault',
    CTEMaterializeAlways = 'CTEMaterializeAlways',
    CTEMaterializeNever = 'CTEMaterializeNever',
  }

  enum SetOperation {
    SET_OPERATION_UNDEFINED = 'SET_OPERATION_UNDEFINED',
    SETOP_NONE = 'SETOP_NONE',
    SETOP_UNION = 'SETOP_UNION',
    SETOP_INTERSECT = 'SETOP_INTERSECT',
    SETOP_EXCEPT = 'SETOP_EXCEPT',
  }

  enum ObjectType {
    OBJECT_TYPE_UNDEFINED = 'OBJECT_TYPE_UNDEFINED',
    OBJECT_ACCESS_METHOD = 'OBJECT_ACCESS_METHOD',
    OBJECT_AGGREGATE = 'OBJECT_AGGREGATE',
    OBJECT_AMOP = 'OBJECT_AMOP',
    OBJECT_AMPROC = 'OBJECT_AMPROC',
    OBJECT_ATTRIBUTE = 'OBJECT_ATTRIBUTE',
    OBJECT_CAST = 'OBJECT_CAST',
    OBJECT_COLUMN = 'OBJECT_COLUMN',
    OBJECT_COLLATION = 'OBJECT_COLLATION',
    OBJECT_CONVERSION = 'OBJECT_CONVERSION',
    OBJECT_DATABASE = 'OBJECT_DATABASE',
    OBJECT_DEFAULT = 'OBJECT_DEFAULT',
    OBJECT_DEFACL = 'OBJECT_DEFACL',
    OBJECT_DOMAIN = 'OBJECT_DOMAIN',
    OBJECT_DOMCONSTRAINT = 'OBJECT_DOMCONSTRAINT',
    OBJECT_EVENT_TRIGGER = 'OBJECT_EVENT_TRIGGER',
    OBJECT_EXTENSION = 'OBJECT_EXTENSION',
    OBJECT_FDW = 'OBJECT_FDW',
    OBJECT_FOREIGN_SERVER = 'OBJECT_FOREIGN_SERVER',
    OBJECT_FOREIGN_TABLE = 'OBJECT_FOREIGN_TABLE',
    OBJECT_FUNCTION = 'OBJECT_FUNCTION',
    OBJECT_INDEX = 'OBJECT_INDEX',
    OBJECT_LANGUAGE = 'OBJECT_LANGUAGE',
    OBJECT_LARGEOBJECT = 'OBJECT_LARGEOBJECT',
    OBJECT_MATVIEW = 'OBJECT_MATVIEW',
    OBJECT_OPCLASS = 'OBJECT_OPCLASS',
    OBJECT_OPERATOR = 'OBJECT_OPERATOR',
    OBJECT_OPFAMILY = 'OBJECT_OPFAMILY',
    OBJECT_POLICY = 'OBJECT_POLICY',
    OBJECT_PROCEDURE = 'OBJECT_PROCEDURE',
    OBJECT_PUBLICATION = 'OBJECT_PUBLICATION',
    OBJECT_PUBLICATION_REL = 'OBJECT_PUBLICATION_REL',
    OBJECT_ROLE = 'OBJECT_ROLE',
    OBJECT_ROUTINE = 'OBJECT_ROUTINE',
    OBJECT_RULE = 'OBJECT_RULE',
    OBJECT_SCHEMA = 'OBJECT_SCHEMA',
    OBJECT_SEQUENCE = 'OBJECT_SEQUENCE',
    OBJECT_SUBSCRIPTION = 'OBJECT_SUBSCRIPTION',
    OBJECT_STATISTIC_EXT = 'OBJECT_STATISTIC_EXT',
    OBJECT_TABCONSTRAINT = 'OBJECT_TABCONSTRAINT',
    OBJECT_TABLE = 'OBJECT_TABLE',
    OBJECT_TABLESPACE = 'OBJECT_TABLESPACE',
    OBJECT_TRANSFORM = 'OBJECT_TRANSFORM',
    OBJECT_TRIGGER = 'OBJECT_TRIGGER',
    OBJECT_TSCONFIGURATION = 'OBJECT_TSCONFIGURATION',
    OBJECT_TSDICTIONARY = 'OBJECT_TSDICTIONARY',
    OBJECT_TSPARSER = 'OBJECT_TSPARSER',
    OBJECT_TSTEMPLATE = 'OBJECT_TSTEMPLATE',
    OBJECT_TYPE = 'OBJECT_TYPE',
    OBJECT_USER_MAPPING = 'OBJECT_USER_MAPPING',
    OBJECT_VIEW = 'OBJECT_VIEW',
  }

  enum DropBehavior {
    DROP_BEHAVIOR_UNDEFINED = 'DROP_BEHAVIOR_UNDEFINED',
    DROP_RESTRICT = 'DROP_RESTRICT',
    DROP_CASCADE = 'DROP_CASCADE',
  }

  enum AlterTableType {
    ALTER_TABLE_TYPE_UNDEFINED = 'ALTER_TABLE_TYPE_UNDEFINED',
    AT_AddColumn = 'AT_AddColumn',
    AT_AddColumnRecurse = 'AT_AddColumnRecurse',
    AT_AddColumnToView = 'AT_AddColumnToView',
    AT_ColumnDefault = 'AT_ColumnDefault',
    AT_CookedColumnDefault = 'AT_CookedColumnDefault',
    AT_DropNotNull = 'AT_DropNotNull',
    AT_SetNotNull = 'AT_SetNotNull',
    AT_DropExpression = 'AT_DropExpression',
    AT_CheckNotNull = 'AT_CheckNotNull',
    AT_SetStatistics = 'AT_SetStatistics',
    AT_SetOptions = 'AT_SetOptions',
    AT_ResetOptions = 'AT_ResetOptions',
    AT_SetStorage = 'AT_SetStorage',
    AT_DropColumn = 'AT_DropColumn',
    AT_DropColumnRecurse = 'AT_DropColumnRecurse',
    AT_AddIndex = 'AT_AddIndex',
    AT_ReAddIndex = 'AT_ReAddIndex',
    AT_AddConstraint = 'AT_AddConstraint',
    AT_AddConstraintRecurse = 'AT_AddConstraintRecurse',
    AT_ReAddConstraint = 'AT_ReAddConstraint',
    AT_ReAddDomainConstraint = 'AT_ReAddDomainConstraint',
    AT_AlterConstraint = 'AT_AlterConstraint',
    AT_ValidateConstraint = 'AT_ValidateConstraint',
    AT_ValidateConstraintRecurse = 'AT_ValidateConstraintRecurse',
    AT_AddIndexConstraint = 'AT_AddIndexConstraint',
    AT_DropConstraint = 'AT_DropConstraint',
    AT_DropConstraintRecurse = 'AT_DropConstraintRecurse',
    AT_ReAddComment = 'AT_ReAddComment',
    AT_AlterColumnType = 'AT_AlterColumnType',
    AT_AlterColumnGenericOptions = 'AT_AlterColumnGenericOptions',
    AT_ChangeOwner = 'AT_ChangeOwner',
    AT_ClusterOn = 'AT_ClusterOn',
    AT_DropCluster = 'AT_DropCluster',
    AT_SetLogged = 'AT_SetLogged',
    AT_SetUnLogged = 'AT_SetUnLogged',
    AT_DropOids = 'AT_DropOids',
    AT_SetTableSpace = 'AT_SetTableSpace',
    AT_SetRelOptions = 'AT_SetRelOptions',
    AT_ResetRelOptions = 'AT_ResetRelOptions',
    AT_ReplaceRelOptions = 'AT_ReplaceRelOptions',
    AT_EnableTrig = 'AT_EnableTrig',
    AT_EnableAlwaysTrig = 'AT_EnableAlwaysTrig',
    AT_EnableReplicaTrig = 'AT_EnableReplicaTrig',
    AT_DisableTrig = 'AT_DisableTrig',
    AT_EnableTrigAll = 'AT_EnableTrigAll',
    AT_DisableTrigAll = 'AT_DisableTrigAll',
    AT_EnableTrigUser = 'AT_EnableTrigUser',
    AT_DisableTrigUser = 'AT_DisableTrigUser',
    AT_EnableRule = 'AT_EnableRule',
    AT_EnableAlwaysRule = 'AT_EnableAlwaysRule',
    AT_EnableReplicaRule = 'AT_EnableReplicaRule',
    AT_DisableRule = 'AT_DisableRule',
    AT_AddInherit = 'AT_AddInherit',
    AT_DropInherit = 'AT_DropInherit',
    AT_AddOf = 'AT_AddOf',
    AT_DropOf = 'AT_DropOf',
    AT_ReplicaIdentity = 'AT_ReplicaIdentity',
    AT_EnableRowSecurity = 'AT_EnableRowSecurity',
    AT_DisableRowSecurity = 'AT_DisableRowSecurity',
    AT_ForceRowSecurity = 'AT_ForceRowSecurity',
    AT_NoForceRowSecurity = 'AT_NoForceRowSecurity',
    AT_GenericOptions = 'AT_GenericOptions',
    AT_AttachPartition = 'AT_AttachPartition',
    AT_DetachPartition = 'AT_DetachPartition',
    AT_AddIdentity = 'AT_AddIdentity',
    AT_SetIdentity = 'AT_SetIdentity',
    AT_DropIdentity = 'AT_DropIdentity',
  }

  enum GrantTargetType {
    GRANT_TARGET_TYPE_UNDEFINED = 'GRANT_TARGET_TYPE_UNDEFINED',
    ACL_TARGET_OBJECT = 'ACL_TARGET_OBJECT',
    ACL_TARGET_ALL_IN_SCHEMA = 'ACL_TARGET_ALL_IN_SCHEMA',
    ACL_TARGET_DEFAULTS = 'ACL_TARGET_DEFAULTS',
  }

  enum VariableSetKind {
    VARIABLE_SET_KIND_UNDEFINED = 'VARIABLE_SET_KIND_UNDEFINED',
    VAR_SET_VALUE = 'VAR_SET_VALUE',
    VAR_SET_DEFAULT = 'VAR_SET_DEFAULT',
    VAR_SET_CURRENT = 'VAR_SET_CURRENT',
    VAR_SET_MULTI = 'VAR_SET_MULTI',
    VAR_RESET = 'VAR_RESET',
    VAR_RESET_ALL = 'VAR_RESET_ALL',
  }

  enum ConstrType {
    CONSTR_TYPE_UNDEFINED = 'CONSTR_TYPE_UNDEFINED',
    CONSTR_NULL = 'CONSTR_NULL',
    CONSTR_NOTNULL = 'CONSTR_NOTNULL',
    CONSTR_DEFAULT = 'CONSTR_DEFAULT',
    CONSTR_IDENTITY = 'CONSTR_IDENTITY',
    CONSTR_GENERATED = 'CONSTR_GENERATED',
    CONSTR_CHECK = 'CONSTR_CHECK',
    CONSTR_PRIMARY = 'CONSTR_PRIMARY',
    CONSTR_UNIQUE = 'CONSTR_UNIQUE',
    CONSTR_EXCLUSION = 'CONSTR_EXCLUSION',
    CONSTR_FOREIGN = 'CONSTR_FOREIGN',
    CONSTR_ATTR_DEFERRABLE = 'CONSTR_ATTR_DEFERRABLE',
    CONSTR_ATTR_NOT_DEFERRABLE = 'CONSTR_ATTR_NOT_DEFERRABLE',
    CONSTR_ATTR_DEFERRED = 'CONSTR_ATTR_DEFERRED',
    CONSTR_ATTR_IMMEDIATE = 'CONSTR_ATTR_IMMEDIATE',
  }

  enum ImportForeignSchemaType {
    IMPORT_FOREIGN_SCHEMA_TYPE_UNDEFINED = 'IMPORT_FOREIGN_SCHEMA_TYPE_UNDEFINED',
    FDW_IMPORT_SCHEMA_ALL = 'FDW_IMPORT_SCHEMA_ALL',
    FDW_IMPORT_SCHEMA_LIMIT_TO = 'FDW_IMPORT_SCHEMA_LIMIT_TO',
    FDW_IMPORT_SCHEMA_EXCEPT = 'FDW_IMPORT_SCHEMA_EXCEPT',
  }

  enum RoleStmtType {
    ROLE_STMT_TYPE_UNDEFINED = 'ROLE_STMT_TYPE_UNDEFINED',
    ROLESTMT_ROLE = 'ROLESTMT_ROLE',
    ROLESTMT_USER = 'ROLESTMT_USER',
    ROLESTMT_GROUP = 'ROLESTMT_GROUP',
  }

  enum FetchDirection {
    FETCH_DIRECTION_UNDEFINED = 'FETCH_DIRECTION_UNDEFINED',
    FETCH_FORWARD = 'FETCH_FORWARD',
    FETCH_BACKWARD = 'FETCH_BACKWARD',
    FETCH_ABSOLUTE = 'FETCH_ABSOLUTE',
    FETCH_RELATIVE = 'FETCH_RELATIVE',
  }

  enum FunctionParameterMode {
    FUNCTION_PARAMETER_MODE_UNDEFINED = 'FUNCTION_PARAMETER_MODE_UNDEFINED',
    FUNC_PARAM_IN = 'FUNC_PARAM_IN',
    FUNC_PARAM_OUT = 'FUNC_PARAM_OUT',
    FUNC_PARAM_INOUT = 'FUNC_PARAM_INOUT',
    FUNC_PARAM_VARIADIC = 'FUNC_PARAM_VARIADIC',
    FUNC_PARAM_TABLE = 'FUNC_PARAM_TABLE',
  }

  enum TransactionStmtKind {
    TRANSACTION_STMT_KIND_UNDEFINED = 'TRANSACTION_STMT_KIND_UNDEFINED',
    TRANS_STMT_BEGIN = 'TRANS_STMT_BEGIN',
    TRANS_STMT_START = 'TRANS_STMT_START',
    TRANS_STMT_COMMIT = 'TRANS_STMT_COMMIT',
    TRANS_STMT_ROLLBACK = 'TRANS_STMT_ROLLBACK',
    TRANS_STMT_SAVEPOINT = 'TRANS_STMT_SAVEPOINT',
    TRANS_STMT_RELEASE = 'TRANS_STMT_RELEASE',
    TRANS_STMT_ROLLBACK_TO = 'TRANS_STMT_ROLLBACK_TO',
    TRANS_STMT_PREPARE = 'TRANS_STMT_PREPARE',
    TRANS_STMT_COMMIT_PREPARED = 'TRANS_STMT_COMMIT_PREPARED',
    TRANS_STMT_ROLLBACK_PREPARED = 'TRANS_STMT_ROLLBACK_PREPARED',
  }

  enum ViewCheckOption {
    VIEW_CHECK_OPTION_UNDEFINED = 'VIEW_CHECK_OPTION_UNDEFINED',
    NO_CHECK_OPTION = 'NO_CHECK_OPTION',
    LOCAL_CHECK_OPTION = 'LOCAL_CHECK_OPTION',
    CASCADED_CHECK_OPTION = 'CASCADED_CHECK_OPTION',
  }

  enum ClusterOption {
    CLUSTER_OPTION_UNDEFINED = 'CLUSTER_OPTION_UNDEFINED',
    CLUOPT_RECHECK = 'CLUOPT_RECHECK',
    CLUOPT_VERBOSE = 'CLUOPT_VERBOSE',
  }

  enum DiscardMode {
    DISCARD_MODE_UNDEFINED = 'DISCARD_MODE_UNDEFINED',
    DISCARD_ALL = 'DISCARD_ALL',
    DISCARD_PLANS = 'DISCARD_PLANS',
    DISCARD_SEQUENCES = 'DISCARD_SEQUENCES',
    DISCARD_TEMP = 'DISCARD_TEMP',
  }

  enum ReindexObjectType {
    REINDEX_OBJECT_TYPE_UNDEFINED = 'REINDEX_OBJECT_TYPE_UNDEFINED',
    REINDEX_OBJECT_INDEX = 'REINDEX_OBJECT_INDEX',
    REINDEX_OBJECT_TABLE = 'REINDEX_OBJECT_TABLE',
    REINDEX_OBJECT_SCHEMA = 'REINDEX_OBJECT_SCHEMA',
    REINDEX_OBJECT_SYSTEM = 'REINDEX_OBJECT_SYSTEM',
    REINDEX_OBJECT_DATABASE = 'REINDEX_OBJECT_DATABASE',
  }

  enum AlterTSConfigType {
    ALTER_TSCONFIG_TYPE_UNDEFINED = 'ALTER_TSCONFIG_TYPE_UNDEFINED',
    ALTER_TSCONFIG_ADD_MAPPING = 'ALTER_TSCONFIG_ADD_MAPPING',
    ALTER_TSCONFIG_ALTER_MAPPING_FOR_TOKEN = 'ALTER_TSCONFIG_ALTER_MAPPING_FOR_TOKEN',
    ALTER_TSCONFIG_REPLACE_DICT = 'ALTER_TSCONFIG_REPLACE_DICT',
    ALTER_TSCONFIG_REPLACE_DICT_FOR_TOKEN = 'ALTER_TSCONFIG_REPLACE_DICT_FOR_TOKEN',
    ALTER_TSCONFIG_DROP_MAPPING = 'ALTER_TSCONFIG_DROP_MAPPING',
  }

  enum AlterSubscriptionType {
    ALTER_SUBSCRIPTION_TYPE_UNDEFINED = 'ALTER_SUBSCRIPTION_TYPE_UNDEFINED',
    ALTER_SUBSCRIPTION_OPTIONS = 'ALTER_SUBSCRIPTION_OPTIONS',
    ALTER_SUBSCRIPTION_CONNECTION = 'ALTER_SUBSCRIPTION_CONNECTION',
    ALTER_SUBSCRIPTION_PUBLICATION = 'ALTER_SUBSCRIPTION_PUBLICATION',
    ALTER_SUBSCRIPTION_REFRESH = 'ALTER_SUBSCRIPTION_REFRESH',
    ALTER_SUBSCRIPTION_ENABLED = 'ALTER_SUBSCRIPTION_ENABLED',
  }

  enum OnCommitAction {
    ON_COMMIT_ACTION_UNDEFINED = 'ON_COMMIT_ACTION_UNDEFINED',
    ONCOMMIT_NOOP = 'ONCOMMIT_NOOP',
    ONCOMMIT_PRESERVE_ROWS = 'ONCOMMIT_PRESERVE_ROWS',
    ONCOMMIT_DELETE_ROWS = 'ONCOMMIT_DELETE_ROWS',
    ONCOMMIT_DROP = 'ONCOMMIT_DROP',
  }

  enum ParamKind {
    PARAM_KIND_UNDEFINED = 'PARAM_KIND_UNDEFINED',
    PARAM_EXTERN = 'PARAM_EXTERN',
    PARAM_EXEC = 'PARAM_EXEC',
    PARAM_SUBLINK = 'PARAM_SUBLINK',
    PARAM_MULTIEXPR = 'PARAM_MULTIEXPR',
  }

  enum CoercionContext {
    COERCION_CONTEXT_UNDEFINED = 'COERCION_CONTEXT_UNDEFINED',
    COERCION_IMPLICIT = 'COERCION_IMPLICIT',
    COERCION_ASSIGNMENT = 'COERCION_ASSIGNMENT',
    COERCION_EXPLICIT = 'COERCION_EXPLICIT',
  }

  enum CoercionForm {
    COERCION_FORM_UNDEFINED = 'COERCION_FORM_UNDEFINED',
    COERCE_EXPLICIT_CALL = 'COERCE_EXPLICIT_CALL',
    COERCE_EXPLICIT_CAST = 'COERCE_EXPLICIT_CAST',
    COERCE_IMPLICIT_CAST = 'COERCE_IMPLICIT_CAST',
  }

  enum BoolExprType {
    BOOL_EXPR_TYPE_UNDEFINED = 'BOOL_EXPR_TYPE_UNDEFINED',
    AND_EXPR = 'AND_EXPR',
    OR_EXPR = 'OR_EXPR',
    NOT_EXPR = 'NOT_EXPR',
  }

  enum SubLinkType {
    SUB_LINK_TYPE_UNDEFINED = 'SUB_LINK_TYPE_UNDEFINED',
    EXISTS_SUBLINK = 'EXISTS_SUBLINK',
    ALL_SUBLINK = 'ALL_SUBLINK',
    ANY_SUBLINK = 'ANY_SUBLINK',
    ROWCOMPARE_SUBLINK = 'ROWCOMPARE_SUBLINK',
    EXPR_SUBLINK = 'EXPR_SUBLINK',
    MULTIEXPR_SUBLINK = 'MULTIEXPR_SUBLINK',
    ARRAY_SUBLINK = 'ARRAY_SUBLINK',
    CTE_SUBLINK = 'CTE_SUBLINK',
  }

  enum RowCompareType {
    ROW_COMPARE_TYPE_UNDEFINED = 'ROW_COMPARE_TYPE_UNDEFINED',
    ROWCOMPARE_LT = 'ROWCOMPARE_LT',
    ROWCOMPARE_LE = 'ROWCOMPARE_LE',
    ROWCOMPARE_EQ = 'ROWCOMPARE_EQ',
    ROWCOMPARE_GE = 'ROWCOMPARE_GE',
    ROWCOMPARE_GT = 'ROWCOMPARE_GT',
    ROWCOMPARE_NE = 'ROWCOMPARE_NE',
  }

  enum MinMaxOp {
    MIN_MAX_OP_UNDEFINED = 'MIN_MAX_OP_UNDEFINED',
    IS_GREATEST = 'IS_GREATEST',
    IS_LEAST = 'IS_LEAST',
  }

  enum SQLValueFunctionOp {
    SQLVALUE_FUNCTION_OP_UNDEFINED = 'SQLVALUE_FUNCTION_OP_UNDEFINED',
    SVFOP_CURRENT_DATE = 'SVFOP_CURRENT_DATE',
    SVFOP_CURRENT_TIME = 'SVFOP_CURRENT_TIME',
    SVFOP_CURRENT_TIME_N = 'SVFOP_CURRENT_TIME_N',
    SVFOP_CURRENT_TIMESTAMP = 'SVFOP_CURRENT_TIMESTAMP',
    SVFOP_CURRENT_TIMESTAMP_N = 'SVFOP_CURRENT_TIMESTAMP_N',
    SVFOP_LOCALTIME = 'SVFOP_LOCALTIME',
    SVFOP_LOCALTIME_N = 'SVFOP_LOCALTIME_N',
    SVFOP_LOCALTIMESTAMP = 'SVFOP_LOCALTIMESTAMP',
    SVFOP_LOCALTIMESTAMP_N = 'SVFOP_LOCALTIMESTAMP_N',
    SVFOP_CURRENT_ROLE = 'SVFOP_CURRENT_ROLE',
    SVFOP_CURRENT_USER = 'SVFOP_CURRENT_USER',
    SVFOP_USER = 'SVFOP_USER',
    SVFOP_SESSION_USER = 'SVFOP_SESSION_USER',
    SVFOP_CURRENT_CATALOG = 'SVFOP_CURRENT_CATALOG',
    SVFOP_CURRENT_SCHEMA = 'SVFOP_CURRENT_SCHEMA',
  }

  enum XmlExprOp {
    XML_EXPR_OP_UNDEFINED = 'XML_EXPR_OP_UNDEFINED',
    IS_XMLCONCAT = 'IS_XMLCONCAT',
    IS_XMLELEMENT = 'IS_XMLELEMENT',
    IS_XMLFOREST = 'IS_XMLFOREST',
    IS_XMLPARSE = 'IS_XMLPARSE',
    IS_XMLPI = 'IS_XMLPI',
    IS_XMLROOT = 'IS_XMLROOT',
    IS_XMLSERIALIZE = 'IS_XMLSERIALIZE',
    IS_DOCUMENT = 'IS_DOCUMENT',
  }

  enum XmlOptionType {
    XML_OPTION_TYPE_UNDEFINED = 'XML_OPTION_TYPE_UNDEFINED',
    XMLOPTION_DOCUMENT = 'XMLOPTION_DOCUMENT',
    XMLOPTION_CONTENT = 'XMLOPTION_CONTENT',
  }

  enum NullTestType {
    NULL_TEST_TYPE_UNDEFINED = 'NULL_TEST_TYPE_UNDEFINED',
    IS_NULL = 'IS_NULL',
    IS_NOT_NULL = 'IS_NOT_NULL',
  }

  enum BoolTestType {
    BOOL_TEST_TYPE_UNDEFINED = 'BOOL_TEST_TYPE_UNDEFINED',
    IS_TRUE = 'IS_TRUE',
    IS_NOT_TRUE = 'IS_NOT_TRUE',
    IS_FALSE = 'IS_FALSE',
    IS_NOT_FALSE = 'IS_NOT_FALSE',
    IS_UNKNOWN = 'IS_UNKNOWN',
    IS_NOT_UNKNOWN = 'IS_NOT_UNKNOWN',
  }

  enum CmdType {
    CMD_TYPE_UNDEFINED = 'CMD_TYPE_UNDEFINED',
    CMD_UNKNOWN = 'CMD_UNKNOWN',
    CMD_SELECT = 'CMD_SELECT',
    CMD_UPDATE = 'CMD_UPDATE',
    CMD_INSERT = 'CMD_INSERT',
    CMD_DELETE = 'CMD_DELETE',
    CMD_UTILITY = 'CMD_UTILITY',
    CMD_NOTHING = 'CMD_NOTHING',
  }

  enum JoinType {
    JOIN_TYPE_UNDEFINED = 'JOIN_TYPE_UNDEFINED',
    JOIN_INNER = 'JOIN_INNER',
    JOIN_LEFT = 'JOIN_LEFT',
    JOIN_FULL = 'JOIN_FULL',
    JOIN_RIGHT = 'JOIN_RIGHT',
    JOIN_SEMI = 'JOIN_SEMI',
    JOIN_ANTI = 'JOIN_ANTI',
    JOIN_UNIQUE_OUTER = 'JOIN_UNIQUE_OUTER',
    JOIN_UNIQUE_INNER = 'JOIN_UNIQUE_INNER',
  }

  enum AggStrategy {
    AGG_STRATEGY_UNDEFINED = 'AGG_STRATEGY_UNDEFINED',
    AGG_PLAIN = 'AGG_PLAIN',
    AGG_SORTED = 'AGG_SORTED',
    AGG_HASHED = 'AGG_HASHED',
    AGG_MIXED = 'AGG_MIXED',
  }

  enum AggSplit {
    AGG_SPLIT_UNDEFINED = 'AGG_SPLIT_UNDEFINED',
    AGGSPLIT_SIMPLE = 'AGGSPLIT_SIMPLE',
    AGGSPLIT_INITIAL_SERIAL = 'AGGSPLIT_INITIAL_SERIAL',
    AGGSPLIT_FINAL_DESERIAL = 'AGGSPLIT_FINAL_DESERIAL',
  }

  enum SetOpCmd {
    SET_OP_CMD_UNDEFINED = 'SET_OP_CMD_UNDEFINED',
    SETOPCMD_INTERSECT = 'SETOPCMD_INTERSECT',
    SETOPCMD_INTERSECT_ALL = 'SETOPCMD_INTERSECT_ALL',
    SETOPCMD_EXCEPT = 'SETOPCMD_EXCEPT',
    SETOPCMD_EXCEPT_ALL = 'SETOPCMD_EXCEPT_ALL',
  }

  enum SetOpStrategy {
    SET_OP_STRATEGY_UNDEFINED = 'SET_OP_STRATEGY_UNDEFINED',
    SETOP_SORTED = 'SETOP_SORTED',
    SETOP_HASHED = 'SETOP_HASHED',
  }

  enum OnConflictAction {
    ON_CONFLICT_ACTION_UNDEFINED = 'ON_CONFLICT_ACTION_UNDEFINED',
    ONCONFLICT_NONE = 'ONCONFLICT_NONE',
    ONCONFLICT_NOTHING = 'ONCONFLICT_NOTHING',
    ONCONFLICT_UPDATE = 'ONCONFLICT_UPDATE',
  }

  enum LimitOption {
    LIMIT_OPTION_UNDEFINED = 'LIMIT_OPTION_UNDEFINED',
    LIMIT_OPTION_DEFAULT = 'LIMIT_OPTION_DEFAULT',
    LIMIT_OPTION_COUNT = 'LIMIT_OPTION_COUNT',
    LIMIT_OPTION_WITH_TIES = 'LIMIT_OPTION_WITH_TIES',
  }

  enum LockClauseStrength {
    LOCK_CLAUSE_STRENGTH_UNDEFINED = 'LOCK_CLAUSE_STRENGTH_UNDEFINED',
    LCS_NONE = 'LCS_NONE',
    LCS_FORKEYSHARE = 'LCS_FORKEYSHARE',
    LCS_FORSHARE = 'LCS_FORSHARE',
    LCS_FORNOKEYUPDATE = 'LCS_FORNOKEYUPDATE',
    LCS_FORUPDATE = 'LCS_FORUPDATE',
  }

  enum LockWaitPolicy {
    LOCK_WAIT_POLICY_UNDEFINED = 'LOCK_WAIT_POLICY_UNDEFINED',
    LockWaitBlock = 'LockWaitBlock',
    LockWaitSkip = 'LockWaitSkip',
    LockWaitError = 'LockWaitError',
  }

  enum LockTupleMode {
    LOCK_TUPLE_MODE_UNDEFINED = 'LOCK_TUPLE_MODE_UNDEFINED',
    LockTupleKeyShare = 'LockTupleKeyShare',
    LockTupleShare = 'LockTupleShare',
    LockTupleNoKeyExclusive = 'LockTupleNoKeyExclusive',
    LockTupleExclusive = 'LockTupleExclusive',
  }

  interface ScanToken {
    start: number;
    end: number;
    token: Token;
    keyword_kind: KeywordKind;
  }

  enum KeywordKind {
    NO_KEYWORD = 'NO_KEYWORD',
    UNRESERVED_KEYWORD = 'UNRESERVED_KEYWORD',
    COL_NAME_KEYWORD = 'COL_NAME_KEYWORD',
    TYPE_FUNC_NAME_KEYWORD = 'TYPE_FUNC_NAME_KEYWORD',
    RESERVED_KEYWORD = 'RESERVED_KEYWORD',
  }

  enum Token {
    NUL = 'NUL',
    // Single-character tokens that are returned 1:1 (identical with "self" list in scan.l)
    // Either supporting syntax, or single-character operators (some can be both)
    // Also see https://www.postgresql.org/docs/12/sql-syntax-lexical.html#SQL-SYNTAX-SPECIAL-CHARS
    ASCII_37 = 'ASCII_37', // "%"
    ASCII_40 = 'ASCII_40', // "("
    ASCII_41 = 'ASCII_41', // ")"
    ASCII_42 = 'ASCII_42', // "*"
    ASCII_43 = 'ASCII_43', // "+"
    ASCII_44 = 'ASCII_44', // ","
    ASCII_45 = 'ASCII_45', // "-"
    ASCII_46 = 'ASCII_46', // "."
    ASCII_47 = 'ASCII_47', // "/"
    ASCII_58 = 'ASCII_58', // ":"
    ASCII_59 = 'ASCII_59', // ","
    ASCII_60 = 'ASCII_60', // "<"
    ASCII_61 = 'ASCII_61', // "="
    ASCII_62 = 'ASCII_62', // ">"
    ASCII_63 = 'ASCII_63', // "?"
    ASCII_91 = 'ASCII_91', // "["
    ASCII_92 = 'ASCII_92', // "\"
    ASCII_93 = 'ASCII_93', // "]"
    ASCII_94 = 'ASCII_94', // "^"
    // Named tokens in scan.l
    IDENT = 'IDENT',
    UIDENT = 'UIDENT',
    FCONST = 'FCONST',
    SCONST = 'SCONST',
    USCONST = 'USCONST',
    BCONST = 'BCONST',
    XCONST = 'XCONST',
    Op = 'Op',
    ICONST = 'ICONST',
    PARAM = 'PARAM',
    TYPECAST = 'TYPECAST',
    DOT_DOT = 'DOT_DOT',
    COLON_EQUALS = 'COLON_EQUALS',
    EQUALS_GREATER = 'EQUALS_GREATER',
    LESS_EQUALS = 'LESS_EQUALS',
    GREATER_EQUALS = 'GREATER_EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    SQL_COMMENT = 'SQL_COMMENT',
    C_COMMENT = 'C_COMMENT',
    ABORT_P = 'ABORT_P',
    ABSOLUTE_P = 'ABSOLUTE_P',
    ACCESS = 'ACCESS',
    ACTION = 'ACTION',
    ADD_P = 'ADD_P',
    ADMIN = 'ADMIN',
    AFTER = 'AFTER',
    AGGREGATE = 'AGGREGATE',
    ALL = 'ALL',
    ALSO = 'ALSO',
    ALTER = 'ALTER',
    ALWAYS = 'ALWAYS',
    ANALYSE = 'ANALYSE',
    ANALYZE = 'ANALYZE',
    AND = 'AND',
    ANY = 'ANY',
    ARRAY = 'ARRAY',
    AS = 'AS',
    ASC = 'ASC',
    ASSERTION = 'ASSERTION',
    ASSIGNMENT = 'ASSIGNMENT',
    ASYMMETRIC = 'ASYMMETRIC',
    AT = 'AT',
    ATTACH = 'ATTACH',
    ATTRIBUTE = 'ATTRIBUTE',
    AUTHORIZATION = 'AUTHORIZATION',
    BACKWARD = 'BACKWARD',
    BEFORE = 'BEFORE',
    BEGIN_P = 'BEGIN_P',
    BETWEEN = 'BETWEEN',
    BIGINT = 'BIGINT',
    BINARY = 'BINARY',
    BIT = 'BIT',
    BOOLEAN_P = 'BOOLEAN_P',
    BOTH = 'BOTH',
    BY = 'BY',
    CACHE = 'CACHE',
    CALL = 'CALL',
    CALLED = 'CALLED',
    CASCADE = 'CASCADE',
    CASCADED = 'CASCADED',
    CASE = 'CASE',
    CAST = 'CAST',
    CATALOG_P = 'CATALOG_P',
    CHAIN = 'CHAIN',
    CHAR_P = 'CHAR_P',
    CHARACTER = 'CHARACTER',
    CHARACTERISTICS = 'CHARACTERISTICS',
    CHECK = 'CHECK',
    CHECKPOINT = 'CHECKPOINT',
    CLASS = 'CLASS',
    CLOSE = 'CLOSE',
    CLUSTER = 'CLUSTER',
    COALESCE = 'COALESCE',
    COLLATE = 'COLLATE',
    COLLATION = 'COLLATION',
    COLUMN = 'COLUMN',
    COLUMNS = 'COLUMNS',
    COMMENT = 'COMMENT',
    COMMENTS = 'COMMENTS',
    COMMIT = 'COMMIT',
    COMMITTED = 'COMMITTED',
    CONCURRENTLY = 'CONCURRENTLY',
    CONFIGURATION = 'CONFIGURATION',
    CONFLICT = 'CONFLICT',
    CONNECTION = 'CONNECTION',
    CONSTRAINT = 'CONSTRAINT',
    CONSTRAINTS = 'CONSTRAINTS',
    CONTENT_P = 'CONTENT_P',
    CONTINUE_P = 'CONTINUE_P',
    CONVERSION_P = 'CONVERSION_P',
    COPY = 'COPY',
    COST = 'COST',
    CREATE = 'CREATE',
    CROSS = 'CROSS',
    CSV = 'CSV',
    CUBE = 'CUBE',
    CURRENT_P = 'CURRENT_P',
    CURRENT_CATALOG = 'CURRENT_CATALOG',
    CURRENT_DATE = 'CURRENT_DATE',
    CURRENT_ROLE = 'CURRENT_ROLE',
    CURRENT_SCHEMA = 'CURRENT_SCHEMA',
    CURRENT_TIME = 'CURRENT_TIME',
    CURRENT_TIMESTAMP = 'CURRENT_TIMESTAMP',
    CURRENT_USER = 'CURRENT_USER',
    CURSOR = 'CURSOR',
    CYCLE = 'CYCLE',
    DATA_P = 'DATA_P',
    DATABASE = 'DATABASE',
    DAY_P = 'DAY_P',
    DEALLOCATE = 'DEALLOCATE',
    DEC = 'DEC',
    DECIMAL_P = 'DECIMAL_P',
    DECLARE = 'DECLARE',
    DEFAULT = 'DEFAULT',
    DEFAULTS = 'DEFAULTS',
    DEFERRABLE = 'DEFERRABLE',
    DEFERRED = 'DEFERRED',
    DEFINER = 'DEFINER',
    DELETE_P = 'DELETE_P',
    DELIMITER = 'DELIMITER',
    DELIMITERS = 'DELIMITERS',
    DEPENDS = 'DEPENDS',
    DESC = 'DESC',
    DETACH = 'DETACH',
    DICTIONARY = 'DICTIONARY',
    DISABLE_P = 'DISABLE_P',
    DISCARD = 'DISCARD',
    DISTINCT = 'DISTINCT',
    DO = 'DO',
    DOCUMENT_P = 'DOCUMENT_P',
    DOMAIN_P = 'DOMAIN_P',
    number_P = 'number_P',
    DROP = 'DROP',
    EACH = 'EACH',
    ELSE = 'ELSE',
    ENABLE_P = 'ENABLE_P',
    ENCODING = 'ENCODING',
    ENCRYPTED = 'ENCRYPTED',
    END_P = 'END_P',
    ENUM_P = 'ENUM_P',
    ESCAPE = 'ESCAPE',
    EVENT = 'EVENT',
    EXCEPT = 'EXCEPT',
    EXCLUDE = 'EXCLUDE',
    EXCLUDING = 'EXCLUDING',
    EXCLUSIVE = 'EXCLUSIVE',
    EXECUTE = 'EXECUTE',
    EXISTS = 'EXISTS',
    EXPLAIN = 'EXPLAIN',
    EXPRESSION = 'EXPRESSION',
    EXTENSION = 'EXTENSION',
    EXTERNAL = 'EXTERNAL',
    EXTRACT = 'EXTRACT',
    FALSE_P = 'FALSE_P',
    FAMILY = 'FAMILY',
    FETCH = 'FETCH',
    FILTER = 'FILTER',
    FIRST_P = 'FIRST_P',
    FLOAT_P = 'FLOAT_P',
    FOLLOWING = 'FOLLOWING',
    FOR = 'FOR',
    FORCE = 'FORCE',
    FOREIGN = 'FOREIGN',
    FORWARD = 'FORWARD',
    FREEZE = 'FREEZE',
    FROM = 'FROM',
    FULL = 'FULL',
    FUNCTION = 'FUNCTION',
    FUNCTIONS = 'FUNCTIONS',
    GENERATED = 'GENERATED',
    GLOBAL = 'GLOBAL',
    GRANT = 'GRANT',
    GRANTED = 'GRANTED',
    GREATEST = 'GREATEST',
    GROUP_P = 'GROUP_P',
    GROUPING = 'GROUPING',
    GROUPS = 'GROUPS',
    HANDLER = 'HANDLER',
    HAVING = 'HAVING',
    HEADER_P = 'HEADER_P',
    HOLD = 'HOLD',
    HOUR_P = 'HOUR_P',
    IDENTITY_P = 'IDENTITY_P',
    IF_P = 'IF_P',
    ILIKE = 'ILIKE',
    IMMEDIATE = 'IMMEDIATE',
    IMMUTABLE = 'IMMUTABLE',
    IMPLICIT_P = 'IMPLICIT_P',
    IMPORT_P = 'IMPORT_P',
    IN_P = 'IN_P',
    INCLUDE = 'INCLUDE',
    INCLUDING = 'INCLUDING',
    INCREMENT = 'INCREMENT',
    INDEX = 'INDEX',
    INDEXES = 'INDEXES',
    INHERIT = 'INHERIT',
    INHERITS = 'INHERITS',
    INITIALLY = 'INITIALLY',
    INLINE_P = 'INLINE_P',
    INNER_P = 'INNER_P',
    INOUT = 'INOUT',
    INPUT_P = 'INPUT_P',
    INSENSITIVE = 'INSENSITIVE',
    INSERT = 'INSERT',
    INSTEAD = 'INSTEAD',
    INT_P = 'INT_P',
    INTEGER = 'INTEGER',
    INTERSECT = 'INTERSECT',
    INTERVAL = 'INTERVAL',
    INTO = 'INTO',
    INVOKER = 'INVOKER',
    IS = 'IS',
    ISNULL = 'ISNULL',
    ISOLATION = 'ISOLATION',
    JOIN = 'JOIN',
    KEY = 'KEY',
    LABEL = 'LABEL',
    LANGUAGE = 'LANGUAGE',
    LARGE_P = 'LARGE_P',
    LAST_P = 'LAST_P',
    LATERAL_P = 'LATERAL_P',
    LEADING = 'LEADING',
    LEAKPROOF = 'LEAKPROOF',
    LEAST = 'LEAST',
    LEFT = 'LEFT',
    LEVEL = 'LEVEL',
    LIKE = 'LIKE',
    LIMIT = 'LIMIT',
    LISTEN = 'LISTEN',
    LOAD = 'LOAD',
    LOCAL = 'LOCAL',
    LOCALTIME = 'LOCALTIME',
    LOCALTIMESTAMP = 'LOCALTIMESTAMP',
    LOCATION = 'LOCATION',
    LOCK_P = 'LOCK_P',
    LOCKED = 'LOCKED',
    LOGGED = 'LOGGED',
    MAPPING = 'MAPPING',
    MATCH = 'MATCH',
    MATERIALIZED = 'MATERIALIZED',
    MAXVALUE = 'MAXVALUE',
    METHOD = 'METHOD',
    MINUTE_P = 'MINUTE_P',
    MINVALUE = 'MINVALUE',
    MODE = 'MODE',
    MONTH_P = 'MONTH_P',
    MOVE = 'MOVE',
    NAME_P = 'NAME_P',
    NAMES = 'NAMES',
    NATIONAL = 'NATIONAL',
    NATURAL = 'NATURAL',
    NCHAR = 'NCHAR',
    NEW = 'NEW',
    NEXT = 'NEXT',
    NFC = 'NFC',
    NFD = 'NFD',
    NFKC = 'NFKC',
    NFKD = 'NFKD',
    NO = 'NO',
    NONE = 'NONE',
    NORMALIZE = 'NORMALIZE',
    NORMALIZED = 'NORMALIZED',
    NOT = 'NOT',
    NOTHING = 'NOTHING',
    NOTIFY = 'NOTIFY',
    NOTNULL = 'NOTNULL',
    NOWAIT = 'NOWAIT',
    NULL_P = 'NULL_P',
    NULLIF = 'NULLIF',
    NULLS_P = 'NULLS_P',
    NUMERIC = 'NUMERIC',
    OBJECT_P = 'OBJECT_P',
    OF = 'OF',
    OFF = 'OFF',
    OFFSET = 'OFFSET',
    OIDS = 'OIDS',
    OLD = 'OLD',
    ON = 'ON',
    ONLY = 'ONLY',
    OPERATOR = 'OPERATOR',
    OPTION = 'OPTION',
    OPTIONS = 'OPTIONS',
    OR = 'OR',
    ORDER = 'ORDER',
    ORDINALITY = 'ORDINALITY',
    OTHERS = 'OTHERS',
    OUT_P = 'OUT_P',
    OUTER_P = 'OUTER_P',
    OVER = 'OVER',
    OVERLAPS = 'OVERLAPS',
    OVERLAY = 'OVERLAY',
    OVERRIDING = 'OVERRIDING',
    OWNED = 'OWNED',
    OWNER = 'OWNER',
    PARALLEL = 'PARALLEL',
    PARSER = 'PARSER',
    PARTIAL = 'PARTIAL',
    PARTITION = 'PARTITION',
    PASSING = 'PASSING',
    PASSWORD = 'PASSWORD',
    PLACING = 'PLACING',
    PLANS = 'PLANS',
    POLICY = 'POLICY',
    POSITION = 'POSITION',
    PRECEDING = 'PRECEDING',
    PRECISION = 'PRECISION',
    PRESERVE = 'PRESERVE',
    PREPARE = 'PREPARE',
    PREPARED = 'PREPARED',
    PRIMARY = 'PRIMARY',
    PRIOR = 'PRIOR',
    PRIVILEGES = 'PRIVILEGES',
    PROCEDURAL = 'PROCEDURAL',
    PROCEDURE = 'PROCEDURE',
    PROCEDURES = 'PROCEDURES',
    PROGRAM = 'PROGRAM',
    PUBLICATION = 'PUBLICATION',
    QUOTE = 'QUOTE',
    RANGE = 'RANGE',
    READ = 'READ',
    REAL = 'REAL',
    REASSIGN = 'REASSIGN',
    RECHECK = 'RECHECK',
    RECURSIVE = 'RECURSIVE',
    REF_P = 'REF_P',
    REFERENCES = 'REFERENCES',
    REFERENCING = 'REFERENCING',
    REFRESH = 'REFRESH',
    REINDEX = 'REINDEX',
    RELATIVE_P = 'RELATIVE_P',
    RELEASE = 'RELEASE',
    RENAME = 'RENAME',
    REPEATABLE = 'REPEATABLE',
    REPLACE = 'REPLACE',
    REPLICA = 'REPLICA',
    RESET = 'RESET',
    RESTART = 'RESTART',
    RESTRICT = 'RESTRICT',
    RETURNING = 'RETURNING',
    RETURNS = 'RETURNS',
    REVOKE = 'REVOKE',
    RIGHT = 'RIGHT',
    ROLE = 'ROLE',
    ROLLBACK = 'ROLLBACK',
    ROLLUP = 'ROLLUP',
    ROUTINE = 'ROUTINE',
    ROUTINES = 'ROUTINES',
    ROW = 'ROW',
    ROWS = 'ROWS',
    RULE = 'RULE',
    SAVEPOINT = 'SAVEPOINT',
    SCHEMA = 'SCHEMA',
    SCHEMAS = 'SCHEMAS',
    SCROLL = 'SCROLL',
    SEARCH = 'SEARCH',
    SECOND_P = 'SECOND_P',
    SECURITY = 'SECURITY',
    SELECT = 'SELECT',
    SEQUENCE = 'SEQUENCE',
    SEQUENCES = 'SEQUENCES',
    SERIALIZABLE = 'SERIALIZABLE',
    SERVER = 'SERVER',
    SESSION = 'SESSION',
    SESSION_USER = 'SESSION_USER',
    SET = 'SET',
    SETS = 'SETS',
    SETOF = 'SETOF',
    SHARE = 'SHARE',
    SHOW = 'SHOW',
    SIMILAR = 'SIMILAR',
    SIMPLE = 'SIMPLE',
    SKIP = 'SKIP',
    SMALLINT = 'SMALLINT',
    SNAPSHOT = 'SNAPSHOT',
    SOME = 'SOME',
    SQL_P = 'SQL_P',
    STABLE = 'STABLE',
    STANDALONE_P = 'STANDALONE_P',
    START = 'START',
    STATEMENT = 'STATEMENT',
    STATISTICS = 'STATISTICS',
    STDIN = 'STDIN',
    STDOUT = 'STDOUT',
    STORAGE = 'STORAGE',
    STORED = 'STORED',
    STRICT_P = 'STRICT_P',
    STRIP_P = 'STRIP_P',
    SUBSCRIPTION = 'SUBSCRIPTION',
    SUBSTRING = 'SUBSTRING',
    SUPPORT = 'SUPPORT',
    SYMMETRIC = 'SYMMETRIC',
    SYSID = 'SYSID',
    SYSTEM_P = 'SYSTEM_P',
    TABLE = 'TABLE',
    TABLES = 'TABLES',
    TABLESAMPLE = 'TABLESAMPLE',
    TABLESPACE = 'TABLESPACE',
    TEMP = 'TEMP',
    TEMPLATE = 'TEMPLATE',
    TEMPORARY = 'TEMPORARY',
    TEXT_P = 'TEXT_P',
    THEN = 'THEN',
    TIES = 'TIES',
    TIME = 'TIME',
    TIMESTAMP = 'TIMESTAMP',
    TO = 'TO',
    TRAILING = 'TRAILING',
    TRANSACTION = 'TRANSACTION',
    TRANSFORM = 'TRANSFORM',
    TREAT = 'TREAT',
    TRIGGER = 'TRIGGER',
    TRIM = 'TRIM',
    TRUE_P = 'TRUE_P',
    TRUNCATE = 'TRUNCATE',
    TRUSTED = 'TRUSTED',
    TYPE_P = 'TYPE_P',
    TYPES_P = 'TYPES_P',
    UESCAPE = 'UESCAPE',
    UNBOUNDED = 'UNBOUNDED',
    UNCOMMITTED = 'UNCOMMITTED',
    UNENCRYPTED = 'UNENCRYPTED',
    UNION = 'UNION',
    UNIQUE = 'UNIQUE',
    UNKNOWN = 'UNKNOWN',
    UNLISTEN = 'UNLISTEN',
    UNLOGGED = 'UNLOGGED',
    UNTIL = 'UNTIL',
    UPDATE = 'UPDATE',
    USER = 'USER',
    USING = 'USING',
    VACUUM = 'VACUUM',
    VALID = 'VALID',
    VALIDATE = 'VALIDATE',
    VALIDATOR = 'VALIDATOR',
    VALUE_P = 'VALUE_P',
    VALUES = 'VALUES',
    VARCHAR = 'VARCHAR',
    VARIADIC = 'VARIADIC',
    VARYING = 'VARYING',
    VERBOSE = 'VERBOSE',
    VERSION_P = 'VERSION_P',
    VIEW = 'VIEW',
    VIEWS = 'VIEWS',
    VOLATILE = 'VOLATILE',
    WHEN = 'WHEN',
    WHERE = 'WHERE',
    WHITESPACE_P = 'WHITESPACE_P',
    WINDOW = 'WINDOW',
    WITH = 'WITH',
    WITHIN = 'WITHIN',
    WITHOUT = 'WITHOUT',
    WORK = 'WORK',
    WRAPPER = 'WRAPPER',
    WRITE = 'WRITE',
    XML_P = 'XML_P',
    XMLATTRIBUTES = 'XMLATTRIBUTES',
    XMLCONCAT = 'XMLCONCAT',
    XMLELEMENT = 'XMLELEMENT',
    XMLEXISTS = 'XMLEXISTS',
    XMLFOREST = 'XMLFOREST',
    XMLNAMESPACES = 'XMLNAMESPACES',
    XMLPARSE = 'XMLPARSE',
    XMLPI = 'XMLPI',
    XMLROOT = 'XMLROOT',
    XMLSERIALIZE = 'XMLSERIALIZE',
    XMLTABLE = 'XMLTABLE',
    YEAR_P = 'YEAR_P',
    YES_P = 'YES_P',
    ZONE = 'ZONE',
    NOT_LA = 'NOT_LA',
    NULLS_LA = 'NULLS_LA',
    WITH_LA = 'WITH_LA',
    POSTFIXOP = 'POSTFIXOP',
    UMINUS = 'UMINUS',
  }

  export function parseQuery(query: string): Promise<ParseResult>;
  export function parseQuerySync(query: string): ParseResult;
  export function parsePlPgSQL(query: string): Promise<PlPgParseResult>;
  export function parsePlPgSQLSync(query: string): PlPgParseResult;
}